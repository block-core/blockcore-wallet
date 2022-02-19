import { Injectable } from '@angular/core';
import { Account, IndexerApiStatus, NetworkStatus } from '../app/interfaces';
import { EnvironmentService } from '../app/services/environment.service';
import { AppManager } from './application-manager';
import { AppState } from './application-state';
import { NetworkLoader } from './network-loader';
import { Network } from './networks';
import { OrchestratorBackgroundService } from './orchestrator';
const axios = require('axios').default;

@Injectable({
    providedIn: 'root'
})
export class NetworkStatusManager {
    private networks = new Map<string, NetworkStatus>();
    allNetworks: Network[];
    private networkStatus = new Map<string, NetworkStatus>();

    constructor(
        private networkLoader: NetworkLoader,
        private env: EnvironmentService,
        private orchestrator: OrchestratorBackgroundService,
        private state: AppState) {

        this.state.networks = this.networkLoader.getNetworks(env.networks);

        // Keep a local state of all networks that exists. We'll use this to allow get operations
        // that always work, even when a certain network is disabled in the UI.
        this.allNetworks = this.networkLoader.getAllNetworks();

        this.allNetworks.forEach(n => {
            this.networkStatus.set(n.id, <NetworkStatus>{ networkType: n.id });
        });

        this.refreshNetworkStatus();
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
            // TODO: FIX THIS SO IT WILL REFRESH ACTIVE WALLET!
            // await this.updateAll(this.walletManager.activeWallet.accounts);
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
            const indexerUrl = this.state.persisted.settings.indexer.replace('{id}', network.id.toLowerCase());
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

                    if (blocksBehind > 10) {
                        networkStatus = {
                            blockSyncHeight: data.syncBlockIndex,
                            networkType: account.networkType,
                            availability: IndexerApiStatus.Syncing,
                            status: 'Syncing'
                        };
                    } else {
                        networkStatus = {
                            blockSyncHeight: data.syncBlockIndex,
                            networkType: account.networkType,
                            availability: IndexerApiStatus.Online,
                            status: 'Online'
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
        return Array.from(this.networks.values());
    }

    get(networkType: string) {
        return this.networks.get(networkType);
    }

    /** Update the network status. This can be done internally or externally, depending on the scenario. */
    update(networkStatus: NetworkStatus) {
        // If there are no block height provided, copy the latest:
        if (!networkStatus.blockSyncHeight) {
            networkStatus.blockSyncHeight = this.networks.get(networkStatus.networkType).blockSyncHeight;
        }

        this.networks.set(networkStatus.networkType, networkStatus);

        // Update the UI with latest network status.
        this.orchestrator.updateNetworkStatus(networkStatus);
    }
}
