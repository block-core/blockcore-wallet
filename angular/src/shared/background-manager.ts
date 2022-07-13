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

  constructor() {}

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

    const store = new NetworkStatusStore();
    await store.load();

    const networkLoader = new NetworkLoader(store);

    // console.debug('All networks:', networkLoader.getAllNetworks());

    try {
      await this.updateAll(accounts, networkLoader, settingStore);
    } catch (err) {
      console.error('Failure during update all network status:', err);
    }
  }

  async fetchWithTimeout(resource: RequestInfo, options: any) {
    const { timeout = 15000 } = options;

    const abortController = new AbortController();
    const id = setTimeout(() => abortController.abort(), timeout);

    const response = await fetch(resource, {
      ...options,
      signal: abortController.signal,
    });
    clearTimeout(id);
    return response;
  }

  /** Will attempt to query all the networks that are used in active wallet. */
  private async updateAll(accounts: Account[], networkLoader: NetworkLoader, settingStore: SettingStore) {
    // Make only a unique list of accounts:
    const uniqueAccounts = accounts.filter((value, index, self) => self.map((x) => x.networkType).indexOf(value.networkType) == index);

    const settings = settingStore.get();

    for (let i = 0; i < uniqueAccounts.length; i++) {
      const account = accounts[i];
      const network = networkLoader.getNetwork(account.networkType);
      const indexerUrls = networkLoader.getServers(network.id, settings.server, settings.indexer);

      if (indexerUrls == null) {
        console.warn(`Invalid configuration of servers. There are no servers registered for network of type ${network.id}.`);
        continue;
      }

      let networkStatuses: NetworkStatus[] = [];

      for (let j = 0; j < indexerUrls.length; j++) {
        let indexerUrl = indexerUrls[j];
        let domain = indexerUrl.substring(indexerUrl.indexOf('//') + 2);
        let networkStatus: NetworkStatus;

        try {
          // Default options are marked with *
          const response = await this.fetchWithTimeout(`${indexerUrl}/api/stats`, {
            timeout: 3000,
            method: 'GET',
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
              'Content-Type': 'application/json',
            },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
          });

          const data = await response.json();

          // const response = await axios.get(`${indexerUrl}/api/stats`, {
          //     timeout: 3000,
          //     'axios-retry': {
          //         retries: 0
          //     }
          // });

          // const data = response.data;

          if (data.error) {
            networkStatus = {
              domain,
              url: indexerUrl,
              blockSyncHeight: -1,
              networkType: account.networkType,
              availability: IndexerApiStatus.Error,
              status: 'Error: ' + data.error,
              relayFee: 0.0001 * FEE_FACTOR,
            };
          } else {
            const blocksBehind = data.blockchain.blocks - data.syncBlockIndex;

            if (blocksBehind > 10) {
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
              relayFee: 0.0001 * FEE_FACTOR,
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
              relayFee: 0.0001 * FEE_FACTOR,
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
              status: error.message,
              relayFee: 0.0001 * FEE_FACTOR,
            };
          }
        }

        // console.debug('networkStatus:', networkStatus);
        networkStatuses.push(networkStatus);
      }

      networkLoader.update(network.id, networkStatuses);
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

    const networkLoader = new NetworkLoader(networkStatusStore);

    const addressManager = new AddressManager(networkLoader);
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

      const processResult = await indexer.process(addressWatchStore);

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
        console.log('ON UPDATES!', processResult);
        this.onUpdates.call(null, processResult);
      }

      // Schedule next execution.
      executionState.wait = 2 ** executionState.executions * executionState.wait;

      if (executionState.wait > 30000) {
        executionState.wait = 30000;
      }

      // Continue running the watcher if it has not been cancelled.
      this.intervalRef = globalThis.setTimeout(interval, executionState.wait);

      console.log('WATCHER: Interval executed completely.');
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

    const networkLoader = new NetworkLoader(networkStatusStore);
    const addressManager = new AddressManager(networkLoader);

    console.log('ALL STORES CREATED!');

    // Get what addresses to watch from local storage.
    // globalThis.chrome.storage.local.get('')
    const indexer = new IndexerBackgroundService(settingStore, walletStore, addressStore, addressIndexedStore, transactionStore, addressManager, accountStateStore, accountHistoryStore);
    indexer.runState = {};

    let processResult: ProcessResult = { completed: false };

    // TODO: https://github.com/block-core/blockcore-wallet/issues/148
    while (!processResult.completed) {
      try {
        processResult = await indexer.process(null);
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

      console.log('INDEXER: Interval executed completely.');
    }
  }
}
