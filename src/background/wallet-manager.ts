import { HDKey } from "micro-bip32";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'micro-bip39';
import { Account, Address, Settings, Wallet } from "../app/interfaces";
import { MINUTE } from "../app/shared/constants";
import { AppManager } from "./application-manager";

/** Manager that keeps state and operations for a single wallet. This object does not keep the password, which must be supplied for signing operations. */
export class WalletManager {
    // addresses: AccountAddress[] = [];
    private lastUsedIndex: number = 0;
    private timer: any;

    constructor(private manager: AppManager) {
        // bip32.fromBase58(xpub).derive(0).derive(1).publicKey;

    }

    getWallets() {
        return this.manager.state.persisted.wallets;
    }

    lockWallets() {
        this.walletSecrets.clear();

        // TODO: REMOVE WHEN READY!
        this.manager.state.passwords.clear();

        // Do we need to save the state and refresh? VERIFY!
        // await this.state.save();
        // this.refreshState();

        this.manager.communication.sendToAll('wallet-locked');
    }

    lockWallet(id: string) {
        this.walletSecrets.delete(id);

        // TODO: REMOVE WHEN READY!
        this.manager.state.passwords.delete(id);

        this.manager.broadcastState();
    }

    async revealSecretRecoveryPhrase(id: string, password: string) {
        var wallet = this.manager.walletManager.getWallet(id);
        let unlockedMnemonic = null;

        if (!wallet) {
            return unlockedMnemonic;
        }

        unlockedMnemonic = await this.manager.crypto.decryptData(wallet.mnemonic, password);

        return unlockedMnemonic;
    }

    /** Contains the password and seed (unlocked) of wallets. This object should never be persisted and only exists in memory. */
    walletSecrets = new Map<string, { password: string, seed: Uint8Array }>();

    /** Returns list of wallet IDs that is currently unlocked. */
    get unlocked(): string[] {
        return Array.from(this.walletSecrets.keys());
    };

    async unlockWallet(id: string, password: string) {
        var wallet = this.manager.walletManager.getWallet(id);
        let unlockedMnemonic = null;

        if (!wallet) {
            return unlockedMnemonic;
        }
        
        unlockedMnemonic = await this.manager.crypto.decryptData(wallet.mnemonic, password);

        if (unlockedMnemonic) {
            this.manager.state.persisted.activeWalletId = wallet.id;

            // From the secret receovery phrase, the master seed is derived.
            // Learn more about the HD keys: https://raw.githubusercontent.com/bitcoin/bips/master/bip-0032/derivation.png
            const masterSeed = mnemonicToSeedSync(unlockedMnemonic);

            // Add this wallet to list of unlocked.
            this.walletSecrets.set(id, { password, seed: masterSeed });

            // TODO: REMOVE!
            this.manager.state.passwords.set(id, password);

            // Make sure we inform all instances when a wallet is unlocked.
            return true;

        } else {
            return false;
        }
    }

    resetTimer() {
        console.log('resetTimer:', this.manager.state.persisted.settings.autoTimeout * MINUTE);

        if (this.timer) {
            clearTimeout(this.timer);
        }

        // We will only set timer if the wallet is actually unlocked.
        if (this.manager.state.passwords.size > 0) {
            console.log('Setting timer to automatically unlock.');
            this.timer = setTimeout(
                () => {
                    this.lockWallets();
                },
                this.manager.state.persisted.settings.autoTimeout * MINUTE
            );
        } else {
            console.log('Timer not set since wallet is not unlocked.');
        }
    }

    get hasWallets(): boolean {
        return this.manager.state.persisted.wallets.length > 0;
    }

    get activeWallet() {
        if (this.manager.state.persisted.activeWalletId) {
            return this.manager.state.persisted.wallets.find(w => w.id == this.manager.state.persisted.activeWalletId);
            // return this.persisted.wallets.get(this.persisted.activeWalletId);
            // return this.persisted.wallets[this.persisted.activeWalletIndex];
        } else {
            return undefined;
        }
    }

    get hasAccounts(): boolean {
        if (!this.activeWallet) {
            return false;
        }

        return this.activeWallet.accounts?.length > 0;
    }

    get activeAccount() {
        if (!this.activeWallet) {
            return null;
        }

        const activeWallet = this.activeWallet;

        if (!activeWallet.accounts) {
            return null;
        }

        if (activeWallet.activeAccountIndex == null || activeWallet.activeAccountIndex == -1) {
            activeWallet.activeAccountIndex = 0;
        }
        // If the active index is higher than available accounts, reset to zero.
        else if (activeWallet.activeAccountIndex >= activeWallet.accounts.length) {
            activeWallet.activeAccountIndex = 0;
        }

        return this.activeWallet.accounts[activeWallet.activeAccountIndex];
    }

    isActiveWalletUnlocked(): boolean {
        let password = this.manager.state.passwords.get(this.activeWallet.id);

        if (password === null || password === undefined || password === '') {
            return false;
        } else {
            return true;
        }
    }

    async setActiveWallet(id: string) {
        this.manager.state.persisted.activeWalletId = id;
        await this.manager.state.save();
        this.manager.broadcastState();
    }

    getWallet(id: string) {
        const wallet = this.manager.state.persisted.wallets.find(w => w.id == id);
        return wallet;
    }

    async removeWallet(id: string) {
        const walletIndex = this.manager.state.persisted.wallets.findIndex(w => w.id == id);

        // Remove the wallet.
        this.manager.state.persisted.wallets.splice(walletIndex, 1);

        // Remove the password for this wallet, if it was unlocked.
        this.manager.state.passwords.delete(id);

        await this.manager.state.save();

        this.manager.broadcastState();
    }

    async addAccount(account: Account) {
        // First derive the xpub and store that on the account.
        const secret = this.walletSecrets.get(this.activeWallet.id);

        const network = this.manager.getNetwork(account.network);

        const masterNode = HDKey.fromMasterSeed(Buffer.from(secret.seed), network.bip32);

        const accountNode = masterNode.derive(`m/${account.purpose}'/${account.network}'/${account.index}'`);

        account.xpub = accountNode.publicExtendedKey;

        // Add account to the wallet and persist.
        this.activeWallet.accounts.push(account);

        // Update the active account index to new account.
        this.activeWallet.activeAccountIndex = (this.activeWallet?.accounts.length - 1) ?? 0;

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

        await this.manager.state.save();
    }

    // TODO: FIX VERY SOON!
    // getAddress(account: Account, index: BigInt) {

    //     // Get the network for this account. Maybe this operation should be done once upon initialize? Consider refactoring.
    //     const network = this.manager.getNetwork(account.network, account.purpose);

    //     this.manager.state.networks.

    //     this.manager.crypto.getAddress()

    //     bip32.fromBase58(xpub).derive(0).derive(1).publicKey;

    //     account.xpub.
    // }

    // getChangeAddress(account: Account) {
    //     // Get the last index without know transactions:
    //     let address = account.state.addresses[account.state.addresses.length - 1];

    //     if (address.totalReceivedCount > 0n) {
    //         // Generate a new address.

    //     }

    //     return address.address;
    // }

    // getChangeAddressByIndex(account: Account, index: number) {
    //     // Get the last index without know transactions:
    //     let address = account.state.addresses[account.state.addresses.length - 1];

    //     if (address.totalReceivedCount > 0n) {
    //         // Generate a new address.

    //     }

    //     return address.address;
    // }

    async getChangeAddress(account: Account) {
        return this.getAddress(account, 1, account.state.change);
    }

    async getReceiveAddress(account: Account) {
        return this.getAddress(account, 0, account.state.receive);
    }

    async getAddress(account: Account, type: number, addresses: Address[]) {
        const index = addresses.length - 1;

        // Get the last index without know transactions:
        let address = addresses[index];

        if (address.totalReceivedCount > 0n) {
            // Generate a new address.
            const addressIndex = index + 1;

            const network = this.manager.getNetwork(account.network, account.purpose);
            const accountNode = HDKey.fromExtendedKey(account.xpub, network.bip32);
            const addressNode = accountNode.deriveChild(type).deriveChild(addressIndex);
            const address = this.manager.crypto.getAddressByNetwork(Buffer.from(addressNode.publicKey), network, account.purposeAddress);

            addresses.push({
                index: addressIndex,
                address: address
            });

            await this.manager.state.save();
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

    addWallet(wallet: Wallet) {
        this.manager.state.persisted.wallets.push(wallet);

        // Change the active wallet to the new one.
        this.manager.state.persisted.activeWalletId = wallet.id;

        if (wallet.restored) {
            // Schedule background processing of the default accounts against the blockchain APIs.
            // This should only register a flag and return from this method to allow UI to continue processing.

            // TODO: Perform blockchain / vault data query and recovery.
            // If there are transactions, DID Documents, NFTs or anythign else, we should launch the
            // query probe here.
        }
    }
}
