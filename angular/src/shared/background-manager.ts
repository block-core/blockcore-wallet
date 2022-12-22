import { AddressManager } from './address-manager';
import { IndexerBackgroundService } from './indexer';
import { NetworkLoader } from './network-loader';
import { AddressStore, SettingStore, TransactionStore, WalletStore, AccountHistoryStore, NetworkStatusStore } from './store';
import { AccountStateStore } from './store/account-state-store';
import { AddressIndexedStore } from './store/address-indexed-store';
import { AddressWatchStore } from './store/address-watch-store';
import { RunState } from './task-runner';
import { Defaults } from './defaults';
import { Account, IndexerApiStatus, NetworkStatus } from './interfaces';
import { SharedManager } from './shared-manager';
import { HDKey } from '@scure/bip32';
import { StateStore } from './store/state-store';
import { CryptoUtility } from '../app/services/crypto-utility';
import { WebRequestService } from './web-request';
const axios = require('axios').default;

const FEE_FACTOR = 100000;

export interface ProcessResult {
  changes?: boolean;
  completed?: boolean;
  cancelled?: boolean;
  failed?: boolean;
}

export class BackgroundManager {
  watcherState: RunState;
  onUpdates: Function;
  onStopped: Function;
  crypto: CryptoUtility;
  webRequest: WebRequestService;

  constructor(private sharedManager: SharedManager) {
    this.crypto = new CryptoUtility();
    this.webRequest = new WebRequestService();
  }

  stop() {
    if (this.watcherState) {
      this.watcherState.cancel = true;
    }

    if (this.intervalRef) {
      globalThis.clearTimeout(this.intervalRef);
      this.intervalRef = null;
    }

    // We can call onStopped immediately here, since the next interval will
    // either not happen or it will simply exit without updating state.
    if (this.onStopped) {
      this.onStopped.call(null);
    }
  }

  intervalRef: any;

  /** This get's wallet and all the accounts within it. */
  async getWalletAndAccounts(walletId: string) {
    const result: any = {};

    const wallet = await this.sharedManager.getWallet(walletId);

    if (!wallet) {
      return null;
    }

    // VERY IMPORTANT WE MAP THE OBJECTS!! These objects contains secret recovery phrase (encrypted) and xpub for accounts!
    result.wallet = {
      id: wallet.id,
      name: wallet.name,
    };

    result.accounts = [];
    // Here we probably need to loop all accounts and get ALL data.

    for (var i = 0; i < wallet.accounts.length; i++) {
      const account = wallet.accounts[i];
      const accountData = await this.getAccount(walletId, account.identifier);

      // VERY IMPORTANT WE MAP THE OBJECTS!!
      // TODO: Decide what to use from account data, history, etc. is available if we want.
      const accountEntry = {
        icon: accountData.account.icon,
        name: accountData.account.name,
        id: accountData.account.identifier,
        network: accountData.account.network,
        networkType: accountData.account.networkType,
        purpose: accountData.account.purpose,
        purposeAddress: accountData.account.purposeAddress,
        type: accountData.account.type,

        history: accountData.accountHistory,
        state: accountData.accountState,
        networkDefinition: accountData.network,
      };

      result.accounts.push(accountEntry);
    }

    return result;
  }

  async getAccount(walletId: string, accountId: string) {
    const wallet = await this.sharedManager.getWallet(walletId);
    const account = this.sharedManager.getAccount(wallet, accountId);
    const network = this.sharedManager.getNetwork(account.networkType);

    const accountStateStore = new AccountStateStore();
    await accountStateStore.load();
    var accountState = accountStateStore.get(account.identifier);

    const accountHistoryStore = new AccountHistoryStore();
    await accountHistoryStore.load();
    var accountHistory = accountHistoryStore.get(account.identifier);

    return { network, account, accountState, accountHistory };
  }

  async getDerivedKeyFromWalletPath(walletId: string, accountId: string, path: string) {
    await this.sharedManager.loadPrivateKeys();

    // Get the secret seed.
    const masterSeedBase64 = this.sharedManager.getPrivateKey(walletId);
    if (!masterSeedBase64) throw "Wallet is locked";
    const masterSeed = Buffer.from(masterSeedBase64, 'base64');

    const wallet = await this.sharedManager.getWallet(walletId);
    const account = this.sharedManager.getAccount(wallet, accountId);
    const network = this.sharedManager.getNetwork(account.networkType);

    // Create the master node.
    const masterNode = HDKey.fromMasterSeed(masterSeed, network.bip32);

    // based on BCIP3 we allow to derive a key only
    // under the wallet path and it must be hardened keys.
    var node = masterNode.derive(`m/3'/${account.network}'/${path}`);
    return { network, node };
  }

  async getKey(walletId: string, accountId: string, keyId: string) {
    await this.sharedManager.loadPrivateKeys();

    // Get the secret seed.
    const masterSeedBase64 = this.sharedManager.getPrivateKey(walletId);
    const masterSeed = Buffer.from(masterSeedBase64, 'base64');

    const wallet = await this.sharedManager.getWallet(walletId);
    const account = this.sharedManager.getAccount(wallet, accountId);
    const network = this.sharedManager.getNetwork(account.networkType);

    // Create the master node.
    const masterNode = HDKey.fromMasterSeed(masterSeed, network.bip32);
    var node = masterNode.derive(`m/${account.purpose}'/${account.network}'/${account.index}'/${keyId}`);
    return { network, node };
  }

  async updateNetworkStatus(instance: string) {
    const walletStore = new WalletStore();
    await walletStore.load();

    const settingStore = new SettingStore();
    await settingStore.load();

    let accounts = walletStore.all().flatMap((w) => w.accounts);

    if (accounts.length == 0) {
      accounts = Defaults.getDefaultAccounts(instance);
    }

    // const networkTypes = accounts.filter((value, index, self) => self.map(x => x.networkType).indexOf(value.networkType) == index).map(m => m.networkType);
    // console.debug('networkTypes:', networkTypes);

    const stateStore = new StateStore();
    await stateStore.load();

    const store = new NetworkStatusStore();
    await store.load();

    // Make sure we have a reference to the latest stores:
    this.sharedManager.networkLoader.store = store;
    this.sharedManager.networkLoader.stateStore = stateStore;

    // const networkLoader = new NetworkLoader(store);
    // console.debug('All networks:', networkLoader.getAllNetworks());

    await this.updateAll(accounts, this.sharedManager.networkLoader, settingStore);
  }

  /** Will attempt to query all the networks that are used in active wallet. */
  private async updateAll(accounts: Account[], networkLoader: NetworkLoader, settingStore: SettingStore) {
    // Make only a unique list of accounts:
    const uniqueAccounts = accounts.filter((value, index, self) => self.map((x) => x.networkType).indexOf(value.networkType) == index);

    const settings = settingStore.get();

    // Load all services from selected nameservers:
    await networkLoader.nameserverService.loadServices(settings.server); // networkGroup from user selection.

    for (let i = 0; i < uniqueAccounts.length; i++) {
      const account = accounts[i];
      const network = networkLoader.getNetwork(account.networkType);
      const indexerUrls = networkLoader.getServers(network.id, settings.server, settings.indexer) || [];

      if (indexerUrls == null && account.type != 'identity') {
        console.warn(`Invalid configuration of servers. There are no servers registered for network of type ${network.id}.`);
        continue;
      }

      let networkStatuses: NetworkStatus[] = [];

      for (let j = 0; j < indexerUrls.length; j++) {
        let indexerUrl = 'https://' + indexerUrls[j].domain;

        if (indexerUrl.indexOf('//') == -1) {
          indexerUrl = 'https://' + indexerUrl;
        }

        let domain = indexerUrl.substring(indexerUrl.indexOf('//') + 2);
        let networkStatus: NetworkStatus;

        try {
          // Default options are marked with *
          const response = await this.webRequest.fetchWithTimeout(`${indexerUrl}/api/stats`, {
            timeout: 3000,
          });

          if (response.ok) {
            const data = await response.json();
            if (data.error) {
              networkStatus = {
                domain,
                url: indexerUrl,
                blockSyncHeight: -1,
                networkType: account.networkType,
                availability: IndexerApiStatus.Error,
                status: 'Error: ' + data.error,
                relayFee: 10,
              };
            } else {
              const blocksBehind = data.blockchain.blocks - data.syncBlockIndex;

              if (blocksBehind > 5) {
                networkStatus = {
                  domain,
                  url: indexerUrl,
                  blockSyncHeight: data.syncBlockIndex,
                  networkType: account.networkType,
                  availability: IndexerApiStatus.Syncing,
                  status: 'Syncing / Progress: ' + data.progress,
                  relayFee: data.network?.relayFee * FEE_FACTOR,
                };
              } else {
                networkStatus = {
                  domain,
                  url: indexerUrl,
                  blockSyncHeight: data.syncBlockIndex,
                  networkType: account.networkType,
                  availability: IndexerApiStatus.Online,
                  status: 'Online / Progress: ' + data.progress,
                  relayFee: data.network?.relayFee * FEE_FACTOR,
                };
              }
            }
          } else {
            networkStatus = {
              domain,
              url: indexerUrl,
              blockSyncHeight: -1,
              networkType: account.networkType,
              availability: IndexerApiStatus.Error,
              status: 'Error: ' + response.status,
              relayFee: 10,
            };
          }
        } catch (error: any) {
          console.log('Error on Network Status Service:', error);

          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            // console.debug(error.response.data);
            // console.debug(error.response.status);
            // console.debug(error.response.headers);

            // When there is response, we'll set status to error.
            networkStatus = {
              domain,
              url: indexerUrl,
              blockSyncHeight: -1,
              networkType: account.networkType,
              availability: IndexerApiStatus.Error,
              status: 'Error',
              relayFee: 10,
            };
          } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            // console.debug(error.request);

            // When there is no response, we'll set status to offline.
            networkStatus = {
              domain,
              url: indexerUrl,
              blockSyncHeight: -1,
              networkType: account.networkType,
              availability: IndexerApiStatus.Offline,
              status: 'Offline',
              relayFee: 10,
            };
          } else {
            // Something happened in setting up the request that triggered an Error
            // console.error('Error', error.message);

            networkStatus = {
              domain,
              url: indexerUrl,
              blockSyncHeight: -1,
              networkType: account.networkType,
              availability: IndexerApiStatus.Unknown,
              status: 'Error:' + error.message,
              relayFee: 10,
            };
          }
        }

        // console.debug('networkStatus:', networkStatus);
        networkStatuses.push(networkStatus);
      }

      await networkLoader.update(network.id, networkStatuses);
      // console.debug('networkStatuses:', networkStatuses);
    }
  }

  async runWatcher(runState: RunState) {
    this.watcherState = runState;

    const settingStore = new SettingStore();
    await settingStore.load();

    const walletStore = new WalletStore();
    await walletStore.load();

    const addressStore = new AddressStore();
    await addressStore.load();

    const addressIndexedStore = new AddressIndexedStore();
    await addressIndexedStore.load();

    const transactionStore = new TransactionStore();
    await transactionStore.load();

    const accountHistoryStore = new AccountHistoryStore();
    await accountHistoryStore.load();

    const addressWatchStore = new AddressWatchStore();
    await addressWatchStore.load();

    const accountStateStore = new AccountStateStore();
    await accountStateStore.load();

    const networkStatusStore = new NetworkStatusStore();
    await networkStatusStore.load();

    const stateStore = new StateStore();
    await stateStore.load();

    // Make sure we have a reference to the latest stores:
    this.sharedManager.networkLoader.store = networkStatusStore;
    this.sharedManager.networkLoader.stateStore = stateStore;

    // const networkLoader = new NetworkLoader(networkStatusStore);

    const addressManager = new AddressManager(this.sharedManager.networkLoader);
    const indexer = new IndexerBackgroundService(settingStore, walletStore, addressStore, addressIndexedStore, transactionStore, addressManager, accountStateStore, accountHistoryStore);
    indexer.runState = this.watcherState;

    const executionState = {
      executions: 0,
      wait: 4,
    };

    var interval = async () => {
      executionState.executions++;

      // If the interval is triggered and state is set to cancel, simply ignore processing.
      if (this.watcherState.cancel) {
        return;
      }

      // Make sure we reload the state store before processing.
      await this.sharedManager.networkLoader.stateStore.load();

      const processResult = await indexer.process(addressWatchStore);

      // Whenever indexer processing is completed, make sure we persist the state store used by network loader.
      await this.sharedManager.networkLoader.stateStore.save();

      // If the process was cancelled mid-process, return immeidately.
      if (processResult.cancelled) {
        return;
      }

      if (processResult.changes) {
        // console.log('Calculate balance for watcher event.');
        // Calculate the balance of the wallets.
        await indexer.calculateBalance();
      }

      if (this.onUpdates) {
        this.onUpdates.call(null, processResult);
      }

      // Schedule next execution.
      executionState.wait = 2 ** executionState.executions * executionState.wait;

      if (executionState.wait > 30000) {
        executionState.wait = 30000;
      }

      // Continue running the watcher if it has not been cancelled.
      this.intervalRef = globalThis.setTimeout(interval, executionState.wait);
    };

    this.intervalRef = globalThis.setTimeout(async () => {
      await interval();
    }, 0);
  }

  async runIndexer() {
    // First update all the data.
    const settingStore = new SettingStore();
    await settingStore.load();

    const walletStore = new WalletStore();
    await walletStore.load();

    const addressStore = new AddressStore();
    await addressStore.load();

    const addressIndexedStore = new AddressIndexedStore();
    await addressIndexedStore.load();

    const transactionStore = new TransactionStore();
    await transactionStore.load();

    const accountHistoryStore = new AccountHistoryStore();
    await accountHistoryStore.load();

    const accountStateStore = new AccountStateStore();
    await accountStateStore.load();

    const networkStatusStore = new NetworkStatusStore();
    await networkStatusStore.load();

    const stateStore = new StateStore();
    await stateStore.load();

    // Make sure we have a reference to the latest stores:
    this.sharedManager.networkLoader.store = networkStatusStore;
    this.sharedManager.networkLoader.stateStore = stateStore;

    // const networkLoader = new NetworkLoader(networkStatusStore);
    const addressManager = new AddressManager(this.sharedManager.networkLoader);

    // Get what addresses to watch from local storage.
    // globalThis.chrome.storage.local.get('')
    const indexer = new IndexerBackgroundService(settingStore, walletStore, addressStore, addressIndexedStore, transactionStore, addressManager, accountStateStore, accountHistoryStore);
    indexer.runState = {};

    let processResult: ProcessResult = { completed: false };

    // TODO: https://github.com/block-core/blockcore-wallet/issues/148
    while (!processResult.completed) {
      try {
        // Make sure we reload the state store before processing.
        await this.sharedManager.networkLoader.stateStore.load();

        processResult = await indexer.process(null);

        // Whenever indexer processing is completed, make sure we persist the state store used by network loader.
        await this.sharedManager.networkLoader.stateStore.save();
      } catch (err) {
        console.error('Failure during indexer processing.', err);
        throw err;
      }

      // If there are no changes, don't re-calculate the balance.
      if (!processResult.changes) {
        // console.log('If there are no changes, don\'t re-calculate the balance.');
      }

      try {
        // console.log('Calculate balance for indexing event.');

        // Calculate the balance of the wallets.
        await indexer.calculateBalance();
      } catch (err) {
        console.error('Failure during calculate balance.', err);
      }

      if (this.onUpdates) {
        this.onUpdates.call(null, processResult);
      }
    }
  }
}
