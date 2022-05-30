// import { Injectable } from '@angular/core';
// import { NetworkStatusStore } from 'src/shared';
// import { Account, IndexerApiStatus, NetworkStatus, NetworkStatusEntry } from '../../shared/interfaces';
// import { EnvironmentService } from './environment.service';
// import { NetworkLoader } from '../../shared/network-loader';
// import { Network } from '../../shared/networks';
// import { SettingsService } from './settings.service';
// import { WalletManager } from './wallet-manager';
// import { FEE_FACTOR, SATOSHI_FACTOR, STATUS_INTERVAL } from '../shared/constants';
// import { LoggerService } from './logger.service';
// import { NetworksService } from './networks.service';
// const axios = require('axios').default;

// export class NetworkStatusManager {
//     allNetworks: Network[];
//     availableNetworks: Network[];
//     store = new NetworkStatusStore();

//     constructor(
//         private networkLoader: NetworkLoader,
//         private env: EnvironmentService,
//         private networkService: NetworksService,
//         private walletManager: WalletManager,
//         private settings: SettingsService) {

//     }

//     async initialize() {
//         // This is the network status instances
//         const existingNetworkState = this.store.all();

//         // Keep a local state of all networks that exists. We'll use this to allow get operations
//         // that always work, even when a certain network is disabled in the UI.
//         this.allNetworks = this.networkLoader.getAllNetworks();

//         // Get an instance of the Network object for all activated networks on this instance.
//         this.availableNetworks = this.networkLoader.getNetworks(this.env.networks);

//         // Go through all available networks and get the status, if available.
//         // this.availableNetworks.forEach(n => {
//         //     const existingState = existingNetworkState.find(e => e.networkType == n.id);

//         //     if (existingState) {
//         //         this.store.set(n.id, existingState);
//         //     } else {
//         //         this.store.set(n.id, <NetworkStatus>{ networkType: n.id, availability: IndexerApiStatus.Unknown });
//         //     }
//         // });

//         await this.refreshNetworkStatus();
//     }

//     /** Get the network definition based upon the network identifier. */
//     getNetwork(networkType: string) {
//         return this.allNetworks.find(w => w.id == networkType);
//     }

//     /** Get the network definition based upon the network number and purpose. The purpose defaults to 44. */
//     getNetworkByPurpose(network: number, purpose: number = 44) {
//         return this.allNetworks.find(w => w.network == network && w.purpose == purpose);
//     }

//     /** Iterate over all active accounts (or default accounts) and check the latest networks status. */
//     async refreshNetworkStatus() {
//         try {
//             if (this.walletManager.activeWallet.accounts.length === 0) {
//                 await this.updateAll(this.walletManager.activeWallet.accounts); // TODO: This should be ALL accounts, not just active wallet.
//             } else {
//                 await this.updateAll(this.networkService.getDefaultAccounts());
//             }
//         }
//         catch (err) {

//         }

//         setTimeout(async () => {
//             await this.refreshNetworkStatus();
//         }, STATUS_INTERVAL);
//     }

//     /** Will attempt to query all the networks that are used in active wallet. */
//     async updateAll(accounts: Account[]) {
//         // Make only a unique list of accounts:
//         const uniqueAccounts = accounts.filter((value, index, self) => self.map(x => x.networkType).indexOf(value.networkType) == index);

//         for (let i = 0; i < uniqueAccounts.length; i++) {
//             const account = accounts[i];
//             const network = this.getNetwork(account.networkType);
//             const indexerUrls = this.networkLoader.getServers(network.id, this.settings.values.server, this.settings.values.indexer);

//             let networkStatuses: NetworkStatus[] = [];

//             for (let j = 0; j < indexerUrls.length; j++) {
//                 let indexerUrl = indexerUrls[j];
//                 let domain = indexerUrl.substring(indexerUrl.indexOf('//') + 2);
//                 let networkStatus: NetworkStatus;

//                 try {
//                     const response = await axios.get(`${indexerUrl}/api/stats`, {
//                         timeout: 3000,
//                         'axios-retry': {
//                             retries: 0
//                         }
//                     });

//                     const data = response.data;

//                     console.debug('Update All Network:', data);

//                     if (data.error) {
//                         networkStatus = {
//                             domain,
//                             url: indexerUrl,
//                             blockSyncHeight: -1,
//                             networkType: account.networkType,
//                             availability: IndexerApiStatus.Error,
//                             status: 'Error: ' + data.error,
//                             relayFee: 0.0001 * FEE_FACTOR
//                         };
//                     } else {
//                         const blocksBehind = (data.blockchain.blocks - data.syncBlockIndex);

//                         if (blocksBehind > 10) {
//                             networkStatus = {
//                                 domain,
//                                 url: indexerUrl,
//                                 blockSyncHeight: data.syncBlockIndex,
//                                 networkType: account.networkType,
//                                 availability: IndexerApiStatus.Syncing,
//                                 status: 'Syncing / Progress: ' + data.progress,
//                                 relayFee: data.network?.relayFee * FEE_FACTOR
//                             };
//                         } else {
//                             networkStatus = {
//                                 domain,
//                                 url: indexerUrl,
//                                 blockSyncHeight: data.syncBlockIndex,
//                                 networkType: account.networkType,
//                                 availability: IndexerApiStatus.Online,
//                                 status: 'Online / Progress: ' + data.progress,
//                                 relayFee: data.network?.relayFee * FEE_FACTOR
//                             };
//                         }
//                     }
//                 } catch (error: any) {
//                     console.log('Error on Network Status Service:', error);

//                     if (error.response) {
//                         // The request was made and the server responded with a status code
//                         // that falls out of the range of 2xx
//                         console.debug(error.response.data);
//                         console.debug(error.response.status);
//                         console.debug(error.response.headers);

//                         // When there is response, we'll set status to error.
//                         networkStatus = {
//                             domain,
//                             url: indexerUrl,
//                             blockSyncHeight: -1,
//                             networkType: account.networkType,
//                             availability: IndexerApiStatus.Error,
//                             status: 'Error',
//                             relayFee: 0.0001 * FEE_FACTOR
//                         };
//                     } else if (error.request) {
//                         // The request was made but no response was received
//                         // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
//                         // http.ClientRequest in node.js
//                         console.debug(error.request);

//                         // When there is no response, we'll set status to offline.
//                         networkStatus = {
//                             domain,
//                             url: indexerUrl,
//                             blockSyncHeight: -1,
//                             networkType: account.networkType,
//                             availability: IndexerApiStatus.Offline,
//                             status: 'Offline',
//                             relayFee: 0.0001 * FEE_FACTOR
//                         };
//                     } else {
//                         // Something happened in setting up the request that triggered an Error
//                         console.error('Error', error.message);

//                         networkStatus = {
//                             domain,
//                             url: indexerUrl,
//                             blockSyncHeight: -1,
//                             networkType: account.networkType,
//                             availability: IndexerApiStatus.Unknown,
//                             status: error.message,
//                             relayFee: 0.0001 * FEE_FACTOR
//                         };
//                     }
//                 }

//                 console.log('networkStatus:', networkStatus);

//                 networkStatuses.push(networkStatus);
//                 // this.update(networkStatus);
//             }

//             this.update(network.id, networkStatuses);

//             console.log('networkStatuses:', networkStatuses);
//         }
//     }

//     getAll() {
//         return this.store.all();
//     }

//     getActive(): NetworkStatusEntry[] {
//         const accounts = this.walletManager.activeWallet.accounts;
//         const uniqueAccountTypes = accounts.filter((value, index, self) => self.map(x => x.networkType).indexOf(value.networkType) == index).map(m => m.networkType);

//         let items: NetworkStatusEntry[] = [];

//         for (let i = 0; i < uniqueAccountTypes.length; i++) {
//             const type = uniqueAccountTypes[i];

//             items.push({
//                 type,
//                 networks: this.store.get(type)
//             });
//         }

//         return items;
//     }

//     get(networkType: string) {
//         return this.store.get(networkType);
//     }

//     /** Update the network status. This can be done internally or externally, depending on the scenario. */
//     async update(networkType: string, networkStatuses: NetworkStatus[]) {
//         // If there are no block height provided, copy the latest:
//         // if (!networkStatus.blockSyncHeight) {
//         //     networkStatus.blockSyncHeight = this.store.get(networkStatus.networkType).blockSyncHeight;
//         // }

//         this.store.set(networkType, networkStatuses);

//         await this.store.save();
//     }
// }
