import { HDKey } from "micro-bip32";
import { mnemonicToSeedSync } from 'micro-bip39';
import { Account, AccountUnspentTransactionOutput, Address, Logger, UnspentTransactionOutput, Wallet } from "../../shared/interfaces";
import { MINUTE } from "../shared/constants";
import { Psbt } from '@blockcore/blockcore-js';
import * as ecc from 'tiny-secp256k1';
import ECPairFactory from 'ecpair';
import { Injectable } from "@angular/core";
import { LoggerService } from "./logger.service";
import { CryptoUtility } from "./crypto-utility";
import axiosRetry from 'axios-retry';
import { SecureStateService } from "./secure-state.service";
import { UIState } from "./ui-state.service";
import { SettingsService } from "./settings.service";
import { BehaviorSubject, Observable } from "rxjs";
import { NetworkLoader } from "../../shared/network-loader";
import { Network } from "../../shared/networks";
import { CommunicationService } from ".";
import { WalletStore } from "src/shared";

const ECPair = ECPairFactory(ecc);
var bitcoinMessage = require('bitcoinjs-message');
const axios = require('axios').default;
axiosRetry(axios, { retries: 3 });

@Injectable({
    providedIn: 'root'
})
/** Manager that keeps state and operations for a single wallet. This object does not keep the password, which must be supplied for signing operations. */
export class WalletManager {
    private timer: any;
    private _activeWalletId: string;
    private allNetworks: Network[];

    get activeWalletId() {
        return this._activeWalletId;
    }

    constructor(
        private networkLoader: NetworkLoader,
        private state: UIState,
        private crypto: CryptoUtility,
        private secure: SecureStateService,
        private store: WalletStore,
        private settings: SettingsService,
        private communication: CommunicationService,
        private logger: LoggerService) {
        this.allNetworks = this.networkLoader.getAllNetworks();
    }

    get hasUnlockedWallets() {
        return (this.secure.unlockedWalletsSubject.value.length > 0);
    }

    get activeWalletUnlocked() {
        return (this.secure.get(this.activeWalletId) != null);
    }

    async save() {
        return this.store.save();
    }

    /** Get the network definition based upon the network identifier. */
    getNetwork(networkType: string) {
        return this.allNetworks.find(w => w.id == networkType);
    }

    async signData(wallet: Wallet, account: Account, address: string, content: string): Promise<string> {
        // TODO: Verify the address for this network!! ... Help the user avoid sending transactions on very wrong addresses.
        const network = this.getNetwork(account.networkType);

        // Get the address from receive or change.
        let addressItem = account.state.receive.find(a => a.address == address);
        let addressType = 0;

        if (!addressItem) {
            addressItem = account.state.change.find(a => a.address == address);
            addressType = 1;
        }

        // Get the secret seed.
        const secret = this.walletSecrets.get(wallet.id);

        // Create the master node.
        const masterNode = HDKey.fromMasterSeed(Buffer.from(secret.seed), network.bip32);

        let addressNode: HDKey;
        addressNode = masterNode.derive(`m/${account.purpose}'/${account.network}'/${account.index}'/${addressType}/${addressItem.index}`);

        try {
            const ecPair = ECPair.fromPrivateKey(Buffer.from(addressNode.privateKey), { network: network });
            const privateKey = ecPair.privateKey;

            var signature = bitcoinMessage.sign(content, privateKey, ecPair.compressed)
            console.log(signature.toString('base64'));
            return signature.toString('base64');
        }
        catch (error) {
            this.logger.error(error);
            throw Error('Unable to sign the transaction. Unable to continue.');
        }
    }

    // TODO: This method is duplicate of Indexer due to circular dependency after refactoring away from background process.
    async getTransactionHex(account: Account, txid: string) {
        const network = this.getNetwork(account.networkType);
        const indexerUrl = this.settings.values.indexer.replace('{id}', network.id.toLowerCase());

        const responseTransactionHex = await axios.get(`${indexerUrl}/api/query/transaction/${txid}/hex`);
        return responseTransactionHex.data;
    }

    // TODO: This method is duplicate of Indexer due to circular dependency after refactoring away from background process.
    async broadcastTransaction(account: Account, txhex: string) {
        // These two entries has been sent from
        const network = this.getNetwork(account.networkType);
        const indexerUrl = this.settings.values.indexer.replace('{id}', network.id.toLowerCase());

        debugger;

        const response = await axios.post(`${indexerUrl}/api/command/send`, txhex, {
            headers: {
                'Content-Type': 'application/json-patch+json',
            }
        });

        const data = response.data;

        this.logger.debug('Should contain transaction ID if broadcast was OK:', data);

        return data;
    }

    async createTransaction(wallet: Wallet, account: Account, address: string, amount: number, fee: number, unspent: AccountUnspentTransactionOutput[]): Promise<{ addresses: string[], transactionHex: string, fee: number, feeRate: number, virtualSize: number, weight: number }> {
        // TODO: Verify the address for this network!! ... Help the user avoid sending transactions on very wrong addresses.
        const network = this.getNetwork(account.networkType);
        const affectedAddresses = [];

        debugger;

        // We currently only support BTC-compatible transactions such as STRAX. We do not support other Blockcore chains that are not PoS v4.
        const tx = new Psbt({ network: network, maximumFeeRate: 5000 });  // satoshi per byte, 5000 is default.
        tx.setVersion(1); // Lock-time is not used so set to 1 (defaults to 2).
        tx.setLocktime(0); // These are defaults. This line is not needed.

        // const unspentReceive = account.state.receive.flatMap(i => i.unspent).filter(i => i !== undefined);
        // const unspentChange = account.state.change.flatMap(i => i.unspent).filter(i => i !== undefined);
        // const unspent = [...unspentReceive, ...unspentChange];

        // Collect unspent until we have enough amount.
        const requiredAmount = BigInt(amount) + BigInt(fee);
        let aggregatedAmount: number = 0;
        const inputs: AccountUnspentTransactionOutput[] = [];

        for (let i = 0; i < unspent.length; i++) {
            const tx = unspent[i];
            aggregatedAmount += <number>tx.balance;

            inputs.push(tx);

            if (aggregatedAmount >= requiredAmount) {
                break;
            }
        }

        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];

            // const hex = await this.getTransactionHex(account, input.transactionHash);
            const hex = input.hex;

            affectedAddresses.push(input.address);

            tx.addInput({
                hash: input.transactionHash,
                index: input.index,
                nonWitnessUtxo: Buffer.from(hex, 'hex')
            });
        }

        debugger;

        // Add the output the user requested.
        tx.addOutput({ address, value: Number(amount) });

        // Take the total sum of the aggregated inputs, remove the sendAmount and fee.
        const changeAmount = Number(aggregatedAmount) - Number(amount) - Number(fee);

        // If there is any change amount left, make sure we send it to the user's change address.
        if (changeAmount > 0) {
            const changeAddress = await this.getChangeAddress(account);

            // // Send the rest to change address.
            tx.addOutput({ address: changeAddress.address, value: changeAmount });
        }

        // Get the secret seed.
        const masterSeedBase64 = this.secure.get(wallet.id);
        const masterSeed = Buffer.from(masterSeedBase64, 'base64');

        // const secret = this.walletSecrets.get(wallet.id);

        // Create the master node.
        const masterNode = HDKey.fromMasterSeed(masterSeed, network.bip32);

        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];

            // Get the index of the address, we need that to get the private key for signing.
            let signingAddress = account.state.receive.find(item => item.address == input.address);

            let addressNode: HDKey;

            if (!signingAddress) {
                signingAddress = account.state.change.find(item => item.address == input.address);
                addressNode = masterNode.derive(`m/${account.purpose}'/${account.network}'/${account.index}'/1/${signingAddress.index}`);
            } else {
                addressNode = masterNode.derive(`m/${account.purpose}'/${account.network}'/${account.index}'/0/${signingAddress.index}`);
            }

            if (!signingAddress) {
                throw Error('Unable to find the signing address for the selected transaction input. Unable to continue.');
            }

            try {
                const ecPair = ECPair.fromPrivateKey(Buffer.from(addressNode.privateKey), { network: network });
                tx.signInput(i, ecPair);
            }
            catch (error) {
                this.logger.error(error);
                throw Error('Unable to sign the transaction. Unable to continue.');
            }
        }

        const finalTransaction = tx.finalizeAllInputs().extractTransaction();
        const transactionHex = finalTransaction.toHex();

        this.logger.debug('TransactionHex', transactionHex);

        return { addresses: affectedAddresses, transactionHex, fee: tx.getFee(), feeRate: tx.getFeeRate(), virtualSize: finalTransaction.virtualSize(), weight: finalTransaction.weight() };
    }

    async sendTransaction(account: Account, transactionHex: string): Promise<{ transactionId: string, transactionHex: string }> {
        this.logger.debug('sendTransaction:TransactionHex', transactionHex);
        const transactionId = await this.broadcastTransaction(account, transactionHex);
        this.logger.debug('TransactionId', transactionId);
        return { transactionId, transactionHex };
    }

    getWallets() {
        return this.store.all();
    }

    lockWallet(id: string) {
        this.walletSecrets.delete(id);
        this.secure.set(id, undefined);
        // TODO: FIX!!!
        // this.manager.broadcastState();
    }

    calculateBalance(account: Account) {
        let balanceReceive = account.state.receive.map(x => x.balance).reduce((x: any, y: any) => x + y);
        let balanceChange = account.state.change.map(x => x.balance).reduce((x: any, y: any) => x + y);

        return (<any>balanceReceive + <any>balanceChange);
    }

    calculatePendingReceived(account: Account) {
        let balanceReceive = account.state.receive.map(x => x.pendingReceived).reduce((x: any, y: any) => x + y);
        let balanceChange = account.state.change.map(x => x.pendingReceived).reduce((x: any, y: any) => x + y);

        return (<any>balanceReceive + <any>balanceChange);
    }

    calculatePendingSent(account: Account) {
        let balanceReceive = account.state.receive.map(x => x.pendingSent).reduce((x: any, y: any) => x + y);
        let balanceChange = account.state.change.map(x => x.pendingSent).reduce((x: any, y: any) => x + y);

        return (<any>balanceReceive + <any>balanceChange);
    }

    async revealSecretRecoveryPhrase(walletId: string, password: string) {
        var wallet = this.getWallet(walletId);
        let unlockedMnemonic = null;

        if (!wallet) {
            return unlockedMnemonic;
        }

        try {
            unlockedMnemonic = await this.crypto.decryptData(wallet.mnemonic, password);
        }
        catch (error) {
            this.logger.error(error);
        }

        return unlockedMnemonic;
    }

    /** Contains the password and seed (unlocked) of wallets. This object should never be persisted and only exists in memory. */
    walletSecrets = new Map<string, { password: string, seed: Uint8Array }>();

    /** Returns list of wallet IDs that is currently unlocked. */
    get unlocked(): string[] {
        return this.secure.unlockedWalletsSubject.value;
    };

    async unlockWallet(walletId: string, password: string) {
        var wallet = this.getWallet(walletId);
        let unlockedMnemonic = null;

        if (!wallet) {
            return unlockedMnemonic;
        }

        unlockedMnemonic = await this.crypto.decryptData(wallet.mnemonic, password);

        if (unlockedMnemonic) {
            // this._activeWalletId = wallet.id;
            // this.state.persisted.previousWalletId = wallet.id;

            // From the secret receovery phrase, the master seed is derived.
            // Learn more about the HD keys: https://raw.githubusercontent.com/bitcoin/bips/master/bip-0032/derivation.png
            const masterSeed = mnemonicToSeedSync(unlockedMnemonic);

            // Add this wallet to list of unlocked.
            this.walletSecrets.set(walletId, { password, seed: masterSeed });

            // Store the decrypted master seed in session state.
            this.secure.set(walletId, Buffer.from(masterSeed).toString('base64'));

            await this.setActiveWallet(wallet.id);

            // Make sure we inform all instances when a wallet is unlocked.
            return true;

        } else {
            return false;
        }
    }

    /** Cange the wallet password in one operation. */
    async changeWalletPassword(walletId: string, oldpassword: string, newpassword: string) {
        var wallet = this.getWallet(walletId);
        let unlockedMnemonic = null;

        if (!wallet) {
            return unlockedMnemonic;
        }

        unlockedMnemonic = await this.crypto.decryptData(wallet.mnemonic, oldpassword);

        if (unlockedMnemonic) {
            // Encrypt the recovery phrase with new password and persist.
            let encryptedRecoveryPhrase = await this.crypto.encryptData(unlockedMnemonic, newpassword);
            wallet.mnemonic = encryptedRecoveryPhrase;

            // Make sure we persist the newly encrypted recovery phrase.
            await this.store.save();

            // Make sure we delete the existing wallet secret for this wallet.
            this.walletSecrets.delete(walletId);

            const masterSeed = mnemonicToSeedSync(unlockedMnemonic);

            // Add this wallet to list of unlocked.
            this.walletSecrets.set(walletId, { password: newpassword, seed: masterSeed });

            // this.state.persisted.previousWalletId = wallet.id;

            return true;
        } else {
            return false;
        }
    }

    async resetTimer() {
        if (this.settings == null || this.settings.values == null) {
            return;
        }

        this.logger.info('resetTimer:', this.settings.values.autoTimeout * MINUTE);

        await globalThis.chrome.storage.local.set({ 'timeout': this.settings.values.autoTimeout * MINUTE });

        // Set the active date from startup.
        await globalThis.chrome.storage.local.set({ 'active': new Date().toJSON() });
    }

    get hasWallets(): boolean {
        return this.getWallets().length > 0;
    }

    activeAccountSubject: BehaviorSubject<Account | undefined> = new BehaviorSubject<Account | undefined>(undefined);

    public get activeAccount$(): Observable<Account | undefined> {
        return this.activeAccountSubject.asObservable();
    }

    activeWalletSubject: BehaviorSubject<Wallet | undefined> = new BehaviorSubject<Wallet | undefined>(undefined);

    public get activeWallet$(): Observable<Wallet | undefined> {
        return this.activeWalletSubject.asObservable();
    }

    get activeWallet() {
        if (this.activeWalletId) {
            return this.store.get(this.activeWalletId);
        } else {
            return undefined;
        }
    }

    get activeAccount() {
        if (!this.activeWallet) {
            return undefined;
        }

        const activeWallet = this.activeWallet;

        if (!activeWallet.accounts) {
            return undefined;
        }

        if (activeWallet.activeAccountId == null) {
            return undefined;
        }

        const accountIndex = activeWallet.accounts.findIndex(a => a.identifier == activeWallet.activeAccountId);

        return this.activeWallet.accounts[accountIndex];
    }

    // hasAccounts(wallet: Wallet): boolean {
    //     return wallet.accounts?.length > 0;
    // }

    get hasAccounts(): boolean {
        return this.activeWallet.accounts?.length > 0;
    }

    // get activeAccount() {
    //     if (!this.activeWallet) {
    //         return null;
    //     }

    //     const activeWallet = this.activeWallet;

    //     if (!activeWallet.accounts) {
    //         return null;
    //     }

    //     if (activeWallet.activeAccountIndex == null || activeWallet.activeAccountIndex == -1) {
    //         activeWallet.activeAccountIndex = 0;
    //     }
    //     // If the active index is higher than available accounts, reset to zero.
    //     else if (activeWallet.activeAccountIndex >= activeWallet.accounts.length) {
    //         activeWallet.activeAccountIndex = 0;
    //     }

    //     return this.activeWallet.accounts[activeWallet.activeAccountIndex];
    // }

    isActiveWalletUnlocked(): boolean {
        let secret = this.walletSecrets.get(this.activeWallet.id);

        if (secret === null || secret.password === null || secret.password === undefined || secret.password === '') {
            return false;
        } else {
            return true;
        }
    }

    async removeAccount(walletId: string, accountId: string) {
        const wallet = this.getWallet(walletId);

        if (!wallet) {
            return;
        }

        const accountIndex = wallet.accounts.findIndex(a => a.identifier == accountId);
        wallet.accounts.splice(accountIndex, 1);

        if (wallet.accounts.length > 0) {
            wallet.activeAccountId = wallet.accounts[0].identifier;
        } else {
            wallet.activeAccountId = null;
        }

        await this.store.save();
    }

    async setActiveWallet(id: string) {
        if (this.activeWalletId != id) {
            this._activeWalletId = id;
            this.state.persisted.previousWalletId = id;

            await this.store.save();
            await this.state.save();

            this.activeWalletSubject.next(this.activeWallet);

            return true;
        }

        return false;
    }

    async setActiveAccount(id: string) {
        if (this.activeWallet.activeAccountId != id) {
            this.activeWallet.activeAccountId = id;
            this.activeAccountSubject.next(this.activeAccount);
            return true;
        }

        return false;
    }

    getAccount(wallet: Wallet, accountId: string) {
        return wallet.accounts.find(a => a.identifier == accountId);
    }

    count() {
        return this.getWallets().length;
    }

    getWallet(id: string) {
        return this.store.get(id);
    }

    async removeWallet(id: string) {
        this.store.remove(id);

        // Remove the password for this wallet, if it was unlocked.
        this.walletSecrets.delete(id);

        // Remove the seed from the secrets.
        this.secure.set(id, undefined);

        await this.store.save();

        // TODO: FIX!!
        // this.manager.broadcastState();
    }

    async addAccount(account: Account, wallet: Wallet) {
        // First derive the xpub and store that on the account.
        const secret = this.walletSecrets.get(wallet.id);

        const network = this.getNetwork(account.networkType);

        const masterNode = HDKey.fromMasterSeed(Buffer.from(secret.seed), network.bip32);

        const accountNode = masterNode.derive(`m/${account.purpose}'/${account.network}'/${account.index}'`);

        account.xpub = accountNode.publicExtendedKey;

        // Add account to the wallet and persist.
        wallet.accounts.push(account);

        // Update the active account index to new account.
        wallet.activeAccountId = account.identifier;

        // After new account has been added and set as active, we'll generate some addresses:

        // Generate the first receive address.
        await this.getReceiveAddress(account);

        // Generate the first change address.
        await this.getChangeAddress(account);

        // const address = this.crypto.getAddressByNetworkp2pkh(identifierKeyPair, network);
        // const address2 = this.crypto.getAddressByNetworkp2pkhFromBuffer(Buffer.from(Array.from(identifierKeyPair2.publicKey!)), network);

        // const idArray = secp256k1.schnorr.getPublicKey(identifierKeyPair.privateKey!.toString('hex'));
        // const id = Buffer.from(idArray).toString('hex');

        // // Uncaught (in promise) TypeError: The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type object
        // const id2Array = secp256k1.schnorr.getPublicKey(Buffer.from(identifierKeyPair2.privateKey!).toString('hex'));
        // const id2 = Buffer.from(id2Array).toString('hex');

        // const id3hex = Buffer.from(identifierKeyPair3.privateKey!).toString('hex');
        // const id3Array = secp256k1.schnorr.getPublicKey(id3hex);
        // const id3 = Buffer.from(id3Array).toString('hex');

        await this.store.save();

        if (wallet.restored) {
            // Schedule background processing of the account against the blockchain APIs.
            // This should only register a flag and return from this method to allow UI to continue processing.

            // TODO: Perform blockchain / vault data query and recovery.
            // If there are transactions, DID Documents, NFTs or anythign else, we should launch the
            // query probe here.

            // TODO: RAISE AN EVENT THAT INDEXER SHOULD TRIGGER ON?!
            // PERHAPS ORCHESTRATOR SOMEHOW?!
            // this.process(account, wallet, false);
            const msg = this.communication.createMessage('index');
            this.communication.send(msg);
        }
    }

    async getChangeAddress(account: Account) {
        return this.getAddress(account, 1, account.state.change);
    }

    async getReceiveAddress(account: Account) {
        return this.getAddress(account, 0, account.state.receive);
    }

    hasBeenUsed(address: Address) {
        return (address.totalReceivedCount > 0n || address.totalSent > 0n || address.totalStakeCount > 0n || address.totalMineCount > 0n);
    }

    async getAddress(account: Account, type: number, addresses: Address[]) {
        const index = addresses.length - 1;

        // Get the last index without know transactions:
        let address = addresses[index];

        if (address == null || this.hasBeenUsed(address)) {
            // Generate a new address.
            const addressIndex = index + 1;

            const network = this.getNetwork(account.networkType);
            const accountNode = HDKey.fromExtendedKey(account.xpub, network.bip32);
            const addressNode = accountNode.deriveChild(type).deriveChild(addressIndex);
            const address = this.crypto.getAddressByNetwork(Buffer.from(addressNode.publicKey), network, account.purposeAddress);

            addresses.push({
                index: addressIndex,
                address: address
            });

            await this.store.save();
        }

        return address;
    }

    getReceiveAddressByIndex(account: Account, index: number) {
        if (index > (account.state?.receive.length - 1)) {
            throw Error('The index is higher than any known address. Use getReceiveAddress to get next receive address.');
        }

        // Get the last index without know transactions:
        return account.state.receive[index];
    }

    getChangeAddressByIndex(account: Account, index: number) {
        if (index > (account.state?.change.length - 1)) {
            throw Error('The index is higher than any known address. Use getChangeAddress to get next change address.');
        }

        // Get the last index without know transactions:
        return account.state.change[index];
    }

    async addWallet(wallet: Wallet) {
        this.store.set(wallet.id, wallet);

        // This will save it.
        await this.setActiveWallet(wallet.id);

        // Persist the newly created wallet.
        // await this.store.save();
    }
}
