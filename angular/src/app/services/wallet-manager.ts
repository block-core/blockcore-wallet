// import { HDKey } from "micro-bip32"; // TODO: Uninstall the previous package, replaced with @scure.
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';
import { Account, Address, CoinSelectionInput, CoinSelectionOutput, CoinSelectionResult, Wallet } from '../../shared';
import { MINUTE } from '../shared/constants';
import { Psbt } from '@blockcore/blockcore-js';
import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';
import { CryptoUtility } from './crypto-utility';
import axiosRetry from 'axios-retry';
import { SecureStateService } from './secure-state.service';
import { UIState } from './ui-state.service';
import { SettingsService } from './settings.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { NetworkLoader } from '../../shared';
import { Network } from '../../shared/networks';
import { AccountHistoryStore, AddressStore, AddressWatchStore, MessageService, WalletStore } from 'src/shared';
import Big from 'big.js';
import { StorageService } from '../../shared/storage.service';
import { RuntimeService } from '../../shared/runtime.service';
import { UnspentOutputService } from './unspent-output.service';
import { AccountStateStore } from 'src/shared/store/account-state-store';
import { CryptoService } from './';
import { StandardTokenStore } from '../../shared/store/standard-token-store';
import { ECPair, bip32 } from '../../shared/noble-ecc-wrapper';

let coinselect = require('coinselect');
let coinsplit = require('coinselect/split');

var bitcoinMessage = require('bitcoinjs-message');
const axios = require('axios').default;
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

@Injectable({
  providedIn: 'root',
})
/** Manager that keeps state and operations for a single wallet. This object does not keep the password, which must be supplied for signing operations. */
export class WalletManager {
  private timer: any;
  private _activeWalletId: string;
  private _activeAccountId: string;
  private allNetworks: Network[];

  get activeWalletId() {
    return this._activeWalletId;
  }

  get activeAccountId() {
    return this._activeAccountId;
  }

  constructor(
    private networkLoader: NetworkLoader,
    private state: UIState,
    private crypto: CryptoUtility,
    private cryptoService: CryptoService,
    private secure: SecureStateService,
    private store: WalletStore,
    private addressStore: AddressStore,
    private addressWatchStore: AddressWatchStore,
    private accountHistoryStore: AccountHistoryStore,
    private settings: SettingsService,
    private unspentService: UnspentOutputService,
    private storage: StorageService,
    private accountStateStore: AccountStateStore,
    private runtime: RuntimeService,
    private logger: LoggerService,
    private tokensStore: StandardTokenStore,
    private message: MessageService
  ) {
    this.allNetworks = this.networkLoader.getAllNetworks();
  }

  get hasUnlockedWallets() {
    return this.secure.unlockedWalletsSubject.value.length > 0;
  }

  get activeWalletUnlocked() {
    return this.secure.get(this.activeWalletId) != null;
  }

  // validateMnemonic(mnemonic: string, wordlist: string) {
  //     return of(bip39.validateMnemonic(mnemonic)).pipe();
  // }

  async save() {
    return this.store.save();
  }

  /** Get the network definition based upon the network identifier. */
  getNetwork(networkType: string) {
    return this.allNetworks.find((w) => w.id == networkType);
  }

  // getIdentityPrivateKey(wallet: Wallet, account: Account) {
  //   // TODO: Verify the address for this network!! ... Help the user avoid sending transactions on very wrong addresses.
  //   const network = this.getNetwork(account.networkType);
  //   const accountState = this.accountStateStore.get(account.identifier);

  //   // Get the secret seed.
  //   const masterSeedBase64 = this.secure.get(wallet.id);
  //   const masterSeed = Buffer.from(masterSeedBase64, 'base64');

  //   // Create the master node.
  //   const masterNode = HDKey.fromMasterSeed(masterSeed, network.bip32);

  //   let addressNode: HDKey;

  //   // TODO: Verify if we need to make hardened keys always for identity?
  //   addressNode = masterNode.derive(`m/${account.purpose}'/${account.network}'/${account.index}'/0'/0'`);

  //   return addressNode;
  // }

  async signData(wallet: Wallet, account: Account, address: string, content: string): Promise<string> {
    // TODO: Verify the address for this network!! ... Help the user avoid sending transactions on very wrong addresses.
    const network = this.getNetwork(account.networkType);
    const accountState = this.accountStateStore.get(account.identifier);

    // Get the address from receive or change.
    let addressItem = accountState.receive.find((a) => a.address == address);
    let addressType = 0;

    if (!addressItem) {
      addressItem = accountState.change.find((a) => a.address == address);
      addressType = 1;
    }

    // Get the secret seed.
    const masterSeedBase64 = this.secure.get(wallet.id);
    const masterSeed = Buffer.from(masterSeedBase64, 'base64');

    // Create the master node.
    const masterNode = HDKey.fromMasterSeed(masterSeed, network.bip32);

    let addressNode: HDKey;
    addressNode = masterNode.derive(`m/${account.purpose}'/${account.network}'/${account.index}'/${addressType}/${addressItem.index}`);

    try {
      var signature = bitcoinMessage.sign(content, Buffer.from(addressNode.privateKey), true, network.messagePrefix);
      return signature.toString('base64');
    } catch (error) {
      this.logger.error(error);
      throw Error('Unable to sign the transaction. Unable to continue.');
    }
  }

  async getPrimaryAddress(account: Account) {
    const accountState = this.accountStateStore.get(account.identifier);
    return accountState.receive[0].address;
  }

  // TODO: This method is duplicate of Indexer due to circular dependency after refactoring away from background process.
  async getTransactionHex(account: Account, txid: string) {
    const network = this.getNetwork(account.networkType);
    // const indexerUrl = this.settings.values.indexer.replace('{id}', network.id.toLowerCase());
    const indexerUrl = this.networkLoader.getServer(network.id, this.settings.values.server, this.settings.values.indexer);

    const responseTransactionHex = await axios.get(`${indexerUrl}/api/query/transaction/${txid}/hex`, {
      withCredentials: false,
    });
    return responseTransactionHex.data;
  }

  // TODO: This method is duplicate of Indexer due to circular dependency after refactoring away from background process.
  async broadcastTransaction(account: Account, txhex: string) {
    // These two entries has been sent from
    const network = this.getNetwork(account.networkType);
    // const indexerUrl = this.settings.values.indexer.replace('{id}', network.id.toLowerCase());
    const indexerUrl = this.networkLoader.getServer(network.id, this.settings.values.server, this.settings.values.indexer);

    const response = await axios.post(`${indexerUrl}/api/command/send`, txhex, {
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json-patch+json',
      },
    });

    const data = response.data;

    this.logger.debug('Should contain transaction ID if broadcast was OK:', data);

    return data;
  }

  async selectUtxos(utxos: { txId: string; vout: number; value: number }[], targets: { address: string; value: number }[], feeRate: number): Promise<CoinSelectionResult> {
    // When user manually edits fee, the value becomes string and not number and the coinselect library is very strict on type.
    if (typeof String(feeRate)) {
      feeRate = Number(feeRate);
    }

    // The coin select library will result in fee rate that is right below what is specified, so for example
    // 10 can result in fees at around 9.9-9.5 etc. and that won't be accepted by the nodes when broadcasted.
    feeRate = feeRate + 1;

    const totalInputAmount = utxos.reduce((partialSum, a) => partialSum + a.value, 0);
    const totalOutputAmount = targets.reduce((partialSum, a) => partialSum + a.value, 0);
    let result: CoinSelectionResult = null;

    // We could/should also check if the output is within the threshold of dust or not.
    if (totalInputAmount == totalOutputAmount) {
      // Remove the "value" from the first (target address) to ensure everything is used (except fee).
      targets[0].value = undefined;

      // Run coinsplit instead of coinselect and remove the specified output for now.
      result = coinsplit(utxos, targets, feeRate) as any;

      // .inputs and .outputs will be undefined if no solution was found
      if (!result.inputs || !result.outputs) {
        throw Error('Unable to estimate fee correctly.');
      }
    } else {
      result = coinselect(utxos, targets, feeRate) as any;

      // .inputs and .outputs will be undefined if no solution was found
      if (!result.inputs || !result.outputs) {
        throw Error('Unable to estimate fee correctly.');
      }
    }

    return result;
  }

  async createTransaction(
    wallet: Wallet,
    account: Account,
    address: string,
    changeAddress: string,
    amount: Big,
    feeRate: number,
    inputs: CoinSelectionInput[],
    outputs: CoinSelectionOutput[],
    nullData?: string // opreturn data
  ): Promise<{
    changeAddress: string;
    changeAmount: Big;
    addresses: string[];
    transactionHex: string;
    fee: number;
    feeRate: number;
    virtualSize: number;
    weight: number;
    data?: string;
    transaction: Psbt;
  }> {
    // TODO: Verify the address for this network!! ... Help the user avoid sending transactions on very wrong addresses.
    const network = this.getNetwork(account.networkType);

    const accountState = this.accountStateStore.get(account.identifier);
    const affectedAddresses: string[] = [];

    const tx = new Psbt({ network: network, maximumFeeRate: network.maximumFeeRate }); // satoshi per byte, 5000 is default.
    tx.setVersion(1); // Lock-time is not used so set to 1 (defaults to 2).
    tx.setLocktime(0); // These are defaults. This line is not needed.

    let aggregatedAmount = Big(0);
    // let inputs: AccountUnspentTransactionOutput[] = [];

    inputs.forEach((input) => {
      tx.addInput({
        hash: input.txId,
        index: input.vout,
        nonWitnessUtxo: input.nonWitnessUtxo,
        // OR (not both)
        // witnessUtxo: input.witnessUtxo,
      });

      if (affectedAddresses.indexOf(input.address) == -1) {
        affectedAddresses.push(input.address);
      }
    });

    // If the user has not supplied override on change address, get the change address automatically.
    if (changeAddress == null || changeAddress == '') {
      const changeAddressItem = await this.getChangeAddress(account);
      changeAddress = changeAddressItem.address;
    }

    let changeAmount = new Big(0); // aggregatedAmount.minus(amount).minus(paymentFee); //  Number(aggregatedAmount) - Number(amount) - Number(fee);

    outputs.forEach((output) => {
      // watch out, outputs may have been added that you need to provide
      // an output address/script for
      if (!output.address) {
        output.address = changeAddress;
        changeAmount = changeAmount.add(output.value); // Aggregate the change amount returned to user.
        console.log('INCREASE CHANGE AMOUNT!!', output);
      }

      if (output.script) {
        tx.addOutput({
          script: output.script,
          value: output.value,
        });
      } else {
        tx.addOutput({
          address: output.address,
          value: output.value,
        });
      }

      if (affectedAddresses.indexOf(output.address) == -1) {
        affectedAddresses.push(output.address);
      }
    });

    // Get the secret seed.
    const masterSeedBase64 = this.secure.get(wallet.id);
    const masterSeed = Buffer.from(masterSeedBase64, 'base64');

    // Create the master node.
    const masterNode = HDKey.fromMasterSeed(masterSeed, network.bip32);

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];

      // Get the index of the address, we need that to get the private key for signing.
      let signingAddress = accountState.receive.find((item) => item.address == input.address);

      let addressNode: HDKey;

      if (!signingAddress) {
        signingAddress = accountState.change.find((item) => item.address == input.address);
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
      } catch (error) {
        this.logger.error(error);
        throw Error('Unable to sign the transaction. Unable to continue.');
      }
    }

    const finalTransaction = tx.finalizeAllInputs().extractTransaction();
    const transactionHex = finalTransaction.toHex();

    console.log('transactionHex:', transactionHex);

    return {
      changeAddress,
      changeAmount,
      addresses: affectedAddresses,
      transactionHex,
      fee: tx.getFee(),
      feeRate: tx.getFeeRate(),
      virtualSize: finalTransaction.virtualSize(),
      weight: finalTransaction.weight(),
      data: nullData,
      transaction: tx,
    };
  }

  async sendTransaction(account: Account, transactionHex: string): Promise<{ transactionResult: string | any; transactionHex: string }> {
    this.logger.debug('sendTransaction:TransactionHex', transactionHex);
    const transactionId = await this.broadcastTransaction(account, transactionHex);
    this.logger.debug('TransactionId', transactionId);
    return { transactionResult: transactionId, transactionHex };
  }

  getWallets() {
    return this.store.all();
  }

  lockWallet(id: string) {
    return this.secure.set(id, undefined);
  }

  async revealSecretRecoveryPhrase(walletId: string, password: string) {
    const wallet = this.getWallet(walletId);
    let unlockedMnemonic = null;

    if (!wallet) {
      return unlockedMnemonic;
    }

    try {
      unlockedMnemonic = await this.cryptoService.decryptData(wallet.mnemonic, password);
    } catch (error) {
      this.logger.error(error);
    }

    return unlockedMnemonic;
  }

  /** Returns list of wallet IDs that is currently unlocked. */
  get unlocked(): string[] {
    return this.secure.unlockedWalletsSubject.value;
  }

  /** Returns list of wallet IDs that is currently unlocked. */
  isUnlocked(walletId: string): boolean {
    return this.secure.unlockedWalletsSubject.value.indexOf(walletId) > -1;
  }

  public getWalletNode(wallet: Wallet) {
    const masterSeedBase64 = this.secure.get(wallet.id);
    const masterSeed = Buffer.from(masterSeedBase64, 'base64');

    const masterNode = HDKey.fromMasterSeed(masterSeed, {
      public: 0x0488b21e,
      private: 0x0488ade4,
    });

    let walletNode = masterNode.derive(`m/3'`);

    return walletNode;
  }

  async unlockWallet(walletId: string, password: string) {
    const wallet = this.getWallet(walletId);
    let unlockedMnemonic = null;

    if (!wallet) {
      return unlockedMnemonic;
    }

    unlockedMnemonic = await this.cryptoService.decryptData(wallet.mnemonic, password);

    let unlockedExtensionWords = undefined;

    if (wallet.extensionWords != null && wallet.extensionWords != '') {
      unlockedExtensionWords = await this.cryptoService.decryptData(wallet.extensionWords, password);
    }

    if (unlockedMnemonic) {
      // From the secret receovery phrase, the master seed is derived.
      // Learn more about the HD keys: https://raw.githubusercontent.com/bitcoin/bips/master/bip-0032/derivation.png
      const masterSeed = mnemonicToSeedSync(unlockedMnemonic, unlockedExtensionWords);

      // Store the decrypted master seed in session state.
      await this.secure.set(walletId, Buffer.from(masterSeed).toString('base64'));

      await this.setActiveWallet(wallet.id);

      // Make sure we inform all instances when a wallet is unlocked.
      return true;
    } else {
      return false;
    }
  }

  async verifyWalletPassword(walletId: string, password: string) {
    const wallet = this.getWallet(walletId);

    if (!wallet) {
      return false;
    }

    const unlockedMnemonic = await this.cryptoService.decryptData(wallet.mnemonic, password);
    return unlockedMnemonic != null && unlockedMnemonic != '';
  }

  /** Cange the wallet password in one operation. */
  async changeWalletPassword(walletId: string, oldpassword: string, newpassword: string) {
    const wallet = this.getWallet(walletId);
    let unlockedMnemonic = null;

    if (!wallet) {
      return unlockedMnemonic;
    }

    unlockedMnemonic = await this.cryptoService.decryptData(wallet.mnemonic, oldpassword);

    let unlockedExtensionWords = undefined;

    if (wallet.extensionWords != null && wallet.extensionWords != '') {
      unlockedExtensionWords = await this.cryptoService.decryptData(wallet.extensionWords, oldpassword);
    }

    if (unlockedMnemonic) {
      // Encrypt the recovery phrase with new password and persist.
      wallet.mnemonic = await this.cryptoService.encryptData(unlockedMnemonic, newpassword);

      // Make sure we persist the newly encrypted recovery phrase.
      await this.store.save();

      const masterSeed = mnemonicToSeedSync(unlockedMnemonic, unlockedExtensionWords);

      // Store the decrypted master seed in session state.
      await this.secure.set(walletId, Buffer.from(masterSeed).toString('base64'));

      return true;
    } else {
      return false;
    }
  }

  async resetTimer() {
    if (this.settings == null || this.settings.values == null) {
      return;
    }

    this.logger.debug('User was active, reset lock timer:', this.settings.values.autoTimeout * MINUTE);
    await this.storage.set('timeout', this.settings.values.autoTimeout * MINUTE, true);
    // await globalThis.chrome.storage.local.set({ 'timeout': this.settings.values.autoTimeout * MINUTE });

    // Set the active date from startup.
    // await globalThis.chrome.storage.local.set({ 'active': new Date().toJSON() });
    await this.storage.set('active', new Date().toJSON(), true);
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
    return this.store.get(this._activeWalletId);
  }

  get activeAccount() {
    if (!this.activeWallet) {
      return undefined;
    }

    const activeWallet = this.activeWallet;

    if (!activeWallet.accounts) {
      return undefined;
    }

    if (this.activeAccountId == null) {
      return undefined;
    }

    const accountIndex = activeWallet.accounts.findIndex((a) => a.identifier == this.activeAccountId);

    // This can happen if the wallet has changed but not the account identifier. When this happens, we'll reset the active account ID.
    if (accountIndex === -1) {
      this._activeAccountId = null;
      return undefined;
    }

    return this.activeWallet.accounts[accountIndex];
  }

  // hasAccounts(wallet: Wallet): boolean {
  //     return wallet.accounts?.length > 0;
  // }

  get hasAccounts(): boolean {
    return this.activeWallet.accounts?.length > 0;
  }

  isActiveWalletUnlocked(): boolean {
    return this.secure.unlocked(this.activeWallet.id);
  }

  async setActiveWallet(id: string) {
    this.logger.debug(`Changing the active wallet to ${id}.`);

    if (this.activeWalletId != id) {
      this._activeWalletId = id;
      this.state.persisted.previousWalletId = id;

      // await this.store.save();
      await this.state.save();

      this.activeWalletSubject.next(this.activeWallet);

      return true;
    }

    return false;
  }

  async setActiveAccount(id: string) {
    this.logger.debug('WalletManager:setActiveAccount:' + id);

    if (this.activeAccountId != id) {
      this._activeAccountId = id;
      this.state.persisted.previousAccountId = id;

      await this.state.save();

      this.activeAccountSubject.next(this.activeAccount);

      return true;
    }

    return false;
  }

  getAccount(wallet: Wallet, accountId: string) {
    return wallet.accounts.find((a) => a.identifier == accountId);
  }

  count() {
    return this.getWallets().length;
  }

  getWallet(id: string) {
    return this.store.get(id);
  }

  private async removeAccountHistory(account: Account) {
    const addresses = this.accountStateStore.getAllAddresses(account.identifier);

    for (let j = 0; j < addresses.length; j++) {
      const address = addresses[j];
      this.addressWatchStore.remove(address);
      this.addressStore.remove(address);
    }

    this.accountHistoryStore.remove(account.identifier);
    this.accountStateStore.remove(account.identifier);

    await this.accountHistoryStore.save();
    await this.accountStateStore.save();
  }

  private async saveAndUpdate() {
    await this.store.save();
    await this.addressWatchStore.save();
    await this.addressStore.save();

    this.logger.debug('accountStateStore:', this.accountStateStore.all());

    this.updateAllInstances();
  }

  async removeAccount(walletId: string, accountId: string) {
    const wallet = this.getWallet(walletId);

    if (!wallet) {
      console.warn('Attempting to remove account from a non-existing wallet.');
      return;
    }

    const accountIndex = wallet.accounts.findIndex((a) => a.identifier == accountId);

    try {
      const account = wallet.accounts[accountIndex];
      await this.removeAccountHistory(account);
    } catch (err) {
      this.logger.error('Failed to remove account history.', err);
    }

    // Remove from accounts list.
    wallet.accounts.splice(accountIndex, 1);

    this._activeAccountId = null;
    // wallet.activeAccountId = null;
    // if (wallet.accounts.length > 0) {
    //     // wallet.activeAccountId = wallet.accounts[0].identifier;
    // } else {
    //     wallet.activeAccountId = null;
    // }

    await this.saveAndUpdate();
  }

  async removeWallet(id: string) {
    // Which stores holds wallet information?
    // WalletStore
    // AddressStore
    // AccountHistoryStore
    // AddressWatchStore
    // TransactionStore (we won't remove txs, as we will need to ensure they are not used in other account/wallets.)

    const wallet = this.getWallet(id);

    if (!wallet) {
      return;
    }

    try {
      for (let i = 0; i < wallet.accounts.length; i++) {
        const account = wallet.accounts[i];
        await this.removeAccountHistory(account);
      }
    } catch {}

    this.store.remove(id);

    // Remove the seed from the secrets.
    await this.secure.set(id, undefined);

    await this.saveAndUpdate();
  }

  updateAllInstances() {
    if (this.runtime.isExtension) {
      // chrome.runtime.sendMessage(
      //   {
      //     type: 'reload',
      //     ext: 'blockcore',
      //     source: 'tab',
      //     target: 'tabs',
      //     host: location.host,
      //   },
      //   function (response) {
      //     // console.log('Extension:sendMessage:response:updated:', response);
      //   }
      // );
    }

    // After updating all UI instances, also make sure we restart the watcher
    // because it holds state while interval looping.
    this.message.send(this.message.createMessage('watch', { force: true }, 'background'));
  }

  async addAccount(account: Account, wallet: Wallet, runIndexIfRestored = true) {
    try {
      // First derive the xpub and store that on the account.
      // const secret = this.walletSecrets.get(wallet.id);
      // Get the secret seed.
      const masterSeedBase64 = this.secure.get(wallet.id);
      const masterSeed = Buffer.from(masterSeedBase64, 'base64');
      const network = this.getNetwork(account.networkType);
      const masterNode = HDKey.fromMasterSeed(masterSeed, network.bip32);

      const accountNode = masterNode.derive(`m/${account.purpose}'/${account.network}'/${account.index}'`);

      account.xpub = accountNode.publicExtendedKey;

      // Add account to the wallet and persist.
      wallet.accounts.push(account);

      // Update the active account index to new account.
      this.state.persisted.previousAccountId = account.identifier;
      this._activeAccountId = account.identifier;

      // if (network.type === 'identity') {
      //   const addressNode = accountNode.deriveChild(0).deriveChild(0);

      // //   secp.getPublicKey()

      //   const publicKey = secp.schnorr.getPublicKey(addressNode.privateKey,);
      //   account.did = `did:is:${secp.utils.bytesToHex(publicKey)}`;
      // } else {
      // }

      // After new account has been added and set as active, we'll generate some addresses:
      this.accountStateStore.set(account.identifier, {
        id: account.identifier,
        balance: 0,
        receive: [
          {
            address: this.getAddressByIndex(account, 0, 0),
            index: 0,
          },
        ],
        change: [
          {
            address: this.getAddressByIndex(account, 1, 0),
            index: 0,
          },
        ],
      });

      await this.store.save();
      await this.state.save();
      await this.accountStateStore.save();

      // TODO: Improve this to only require full updateAll for networks but only newly added account's network.

      // Make sure we have status on the network added in this new account and then run indexing. This is not await, so
      // potential race condition here the first loop of indexing.
      this.message.send(this.message.createMessage('network', null, 'background'));

      // If the wallet type is restored, force an index process to restore the state.
      // if (wallet.restored && runIndexIfRestored == true) {
      //   this.message.send(this.message.createMessage('index', { force: true }, 'background'));
      // }

      if (network.smartContractSupport) {
        await this.loadStandardTokensForAccountAsync(network, account);
      }
    } catch (err) {
      throw new Error('Unable to add account to wallet.');
    }
  }

  async loadStandardTokensForAccountAsync(network: Network, account: Account) {
    try {
      const indexerUrl = this.networkLoader.getServer(network.id, this.settings.values.server, this.settings.values.indexer);

      if (!indexerUrl) {
        return;
      }

      const address = this.getReceiveAddressByIndex(account, 0);
      const tokens = await axios.get(`${indexerUrl}/api/query/${network.name.toLowerCase()}/tokens/${address.address}`);

      if (tokens.status == 200) {
        this.tokensStore.set(account.identifier, { tokens: tokens.data });
        await this.tokensStore.save();
      }
    } catch (err) {
      console.error('Failed to load standard tokens for account: ', account.name);
    }
  }

  async getChangeAddress(account: Account) {
    const accountState = this.accountStateStore.get(account.identifier);
    return this.getAddress(account, 1, accountState.change);
  }

  async getReceiveAddress(account: Account) {
    const accountState = this.accountStateStore.get(account.identifier);
    return this.getAddress(account, 0, accountState.receive);
  }

  hasBeenUsed(address: Address) {
    return address.totalReceivedCount > 0n || address.totalSent > 0n || address.totalStakeCount > 0n || address.totalMineCount > 0n;
  }

  private async getAddress(account: Account, type: number, addresses: Address[]) {
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
        address: address,
      });

      await this.accountStateStore.save();
    }

    return address;
  }

  private getAddressByIndex(account: Account, type: number, index: number) {
    const network = this.getNetwork(account.networkType);
    const accountNode = HDKey.fromExtendedKey(account.xpub, network.bip32);
    const addressNode = accountNode.deriveChild(type).deriveChild(index);

    // if (account.type === 'identity') {
    //   return 'YEES!';
    // }

    return this.crypto.getAddressByNetwork(Buffer.from(addressNode.publicKey), network, account.purposeAddress);
  }

  getReceiveAddressByIndex(account: Account, index: number) {
    const accountState = this.accountStateStore.get(account.identifier);

    if (index > accountState.receive.length - 1) {
      throw Error('The index is higher than any known address. Use getReceiveAddress to get next receive address.');
    }

    // Get the last index without know transactions:
    return accountState.receive[index];
  }

  getChangeAddressByIndex(account: Account, index: number) {
    const accountState = this.accountStateStore.get(account.identifier);

    if (index > accountState.change.length - 1) {
      throw Error('The index is higher than any known address. Use getChangeAddress to get next change address.');
    }

    // Get the last index without know transactions:
    return accountState.change[index];
  }

  async addWallet(wallet: Wallet) {
    this.store.set(wallet.id, wallet);

    // This will save it.
    await this.setActiveWallet(wallet.id);
  }
}
