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
                const response = await axios.get(`${indexerUrl}/api/stats`);
                const data = response.data;

                const blocksBehind = data.blockchain.blocks - data.syncBlockIndex;
                console.log('BLOCKS BEHIND', blocksBehind);

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
            } catch (err) {
                networkStatus = {
                    networkType: account.networkType,
                    availability: IndexerApiStatus.Offline,
                    status: 'Offline'
                };
            }

            this.update(networkStatus);
        }
    }

    getAll() {
        return Array.from(this.networks.values());
    }

    /** Update the network status. This can be done internally or externally, depending on the scenario. */
    update(networkStatus: NetworkStatus) {
        this.networks.set(networkStatus.networkType, networkStatus);

        // Update the UI with latest network status.
        this.manager.orchestrator.updateNetworkStatus(networkStatus);
    }
}
