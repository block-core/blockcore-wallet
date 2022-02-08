import { Account, IndexerApiStatus, NetworkStatus } from '../app/interfaces';
import { AppManager } from './application-manager';
const axios = require('axios').default;

export class NetworkStatusManager {
    private networks = new Map<string, NetworkStatus>();

    constructor(private manager: AppManager) {

    }

    /** Will attempt to query all the networks that are used in active wallet. */
    async updateAll(accounts: Account[]) {
        // Make only a unique list of accounts:
        const uniqueAccounts = accounts.filter((value, index, self) => self.map(x => x.networkType).indexOf(value.networkType) == index);

        for (let i = 0; i < uniqueAccounts.length; i++) {
            const account = accounts[i];
            const network = this.manager.getNetwork(account.networkType);
            const indexerUrl = this.manager.state.persisted.settings.indexer.replace('{id}', network.id.toLowerCase());
            let networkStatus: NetworkStatus;

            try {
                const response = await axios.get(`${indexerUrl}/api/stats`, {
                    'axios-retry': {
                        retries: 0
                    }
                });

                const data = response.data;
                const blocksBehind = (data.blockchain.blocks - data.syncBlockIndex);

                if (blocksBehind > 10) {
                    networkStatus = {
                        networkType: account.networkType,
                        availability: IndexerApiStatus.Syncing,
                        status: 'Syncing'
                    };
                } else {
                    networkStatus = {
                        networkType: account.networkType,
                        availability: IndexerApiStatus.Online,
                        status: 'Online'
                    };
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
                        networkType: account.networkType,
                        availability: IndexerApiStatus.Offline,
                        status: 'Offline'
                    };
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log('Error', error.message);

                    networkStatus = {
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
        this.networks.set(networkStatus.networkType, networkStatus);

        // Update the UI with latest network status.
        this.manager.orchestrator.updateNetworkStatus(networkStatus);
    }
}
