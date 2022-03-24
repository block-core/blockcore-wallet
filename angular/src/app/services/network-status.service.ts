import { Injectable } from '@angular/core';
import { NetworkStatusStore } from 'src/shared';
import { Account, IndexerApiStatus, NetworkStatus } from '../../shared/interfaces';
import { EnvironmentService } from './environment.service';
import { NetworkLoader } from '../../shared/network-loader';
import { Network } from '../../shared/networks';
import { SettingsService } from './settings.service';
import { WalletManager } from './wallet-manager';
const axios = require('axios').default;

@Injectable({
    providedIn: 'root'
})
export class NetworkStatusService {
    allNetworks: Network[];
    availableNetworks: Network[];

    constructor(
        private networkLoader: NetworkLoader,
        private env: EnvironmentService,
        private store: NetworkStatusStore,
        private walletManager: WalletManager,
        private settings: SettingsService) {

    }

    async initialize() {
        // This is the network status instances
        const existingNetworkState = this.store.all();

        // Keep a local state of all networks that exists. We'll use this to allow get operations
        // that always work, even when a certain network is disabled in the UI.
        this.allNetworks = this.networkLoader.getAllNetworks();

        // Get an instance of the Network object for all activated networks on this instance.
        this.availableNetworks = this.networkLoader.getNetworks(this.env.networks);

        // Go through all available networks and get the status, if available.
        this.availableNetworks.forEach(n => {
            const existingState = existingNetworkState.find(e => e.networkType == n.id);

            if (existingState) {
                this.store.set(n.id, existingState);
            } else {
                this.store.set(n.id, <NetworkStatus>{ networkType: n.id, availability: IndexerApiStatus.Unknown });
            }
        });

        await this.refreshNetworkStatus();
    }

    /** Get the network definition based upon the network identifier. */
    getNetwork(networkType: string) {
        return this.allNetworks.find(w => w.id == networkType);
    }

    /** Get the network definition based upon the network number and purpose. The purpose defaults to 44. */
    getNetworkByPurpose(network: number, purpose: number = 44) {
        return this.allNetworks.find(w => w.network == network && w.purpose == purpose);
    }

    /** Iterate over all active accounts and check the latest networks status. */
    async refreshNetworkStatus() {
        try {
            await this.updateAll(this.walletManager.activeWallet.accounts);
        }
        catch (err) {

        }

        setTimeout(async () => {
            await this.refreshNetworkStatus();
        }, 10000);
    }

    /** Will attempt to query all the networks that are used in active wallet. */
    async updateAll(accounts: Account[]) {
        // Make only a unique list of accounts:
        const uniqueAccounts = accounts.filter((value, index, self) => self.map(x => x.networkType).indexOf(value.networkType) == index);

        for (let i = 0; i < uniqueAccounts.length; i++) {
            const account = accounts[i];
            const network = this.getNetwork(account.networkType);
            const indexerUrl = this.settings.values.indexer.replace('{id}', network.id.toLowerCase());
            let networkStatus: NetworkStatus;

            try {
                const response = await axios.get(`${indexerUrl}/api/stats`, {
                    'axios-retry': {
                        retries: 0
                    }
                });

                const data = response.data;

                if (data.error) {
                    networkStatus = {
                        blockSyncHeight: -1,
                        networkType: account.networkType,
                        availability: IndexerApiStatus.Error,
                        status: 'Error: ' + data.error
                    };
                } else {
                    const blocksBehind = (data.blockchain.blocks - data.syncBlockIndex);

                    console.log('data.syncBlockIndex:', data.syncBlockIndex);
                    console.log('data.blockchain.blocks:', data.blockchain.blocks);
                    console.log('data:', data);

                    if (blocksBehind > 10) {
                        networkStatus = {
                            blockSyncHeight: data.syncBlockIndex,
                            networkType: account.networkType,
                            availability: IndexerApiStatus.Syncing,
                            status: 'Syncing / Progress: ' + data.progress,
                        };
                    } else {
                        networkStatus = {
                            blockSyncHeight: data.syncBlockIndex,
                            networkType: account.networkType,
                            availability: IndexerApiStatus.Online,
                            status: 'Online / Progress: ' + data.progress,
                        };
                    }
                }
            } catch (error: any) {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);

                    // When there is response, we'll set status to error.
                    networkStatus = {
                        blockSyncHeight: -1,
                        networkType: account.networkType,
                        availability: IndexerApiStatus.Error,
                        status: 'Error'
                    };
                } else if (error.request) {
                    // The request was made but no response was received
                    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                    // http.ClientRequest in node.js
                    console.log(error.request);

                    // When there is no response, we'll set status to offline.
                    networkStatus = {
                        blockSyncHeight: -1,
                        networkType: account.networkType,
                        availability: IndexerApiStatus.Offline,
                        status: 'Offline'
                    };
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log('Error', error.message);

                    networkStatus = {
                        blockSyncHeight: -1,
                        networkType: account.networkType,
                        availability: IndexerApiStatus.Unknown,
                        status: error.message
                    };
                }
            }

            this.update(networkStatus);
        }
    }

    getAll() {
        return this.store.all();
    }

    get(networkType: string) {
        return this.store.get(networkType);
    }

    /** Update the network status. This can be done internally or externally, depending on the scenario. */
    async update(networkStatus: NetworkStatus) {

        console.log('UPDATE', networkStatus);

        // If there are no block height provided, copy the latest:
        if (!networkStatus.blockSyncHeight) {
            networkStatus.blockSyncHeight = this.store.get(networkStatus.networkType).blockSyncHeight;
        }

        this.store.set(networkStatus.networkType, networkStatus);

        await this.store.save();
    }
}
