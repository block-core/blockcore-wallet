import { Account, NetworkStatus } from '../app/interfaces';
import { AppManager } from './application-manager';

export class NetworkStatusManager {
    private networks = new Map<string, NetworkStatus>();

    constructor(private manager: AppManager) {
    }

    /** Will attempt to query all the networks that are used in active wallet. */
    async updateAll(accounts: Account[]) {
        for (let i = 0; i < accounts.length; i++) {

            const account = accounts[i];
            let networkStatus: NetworkStatus;

            try {
                // GET INFO API
                networkStatus = {
                    networkType: account.networkType,
                    available: true,
                    status: 'OK'
                };
            } catch (err) {
                networkStatus = {
                    networkType: account.networkType,
                    available: false,
                    status: 'Error'
                };
            }

            this.update(networkStatus);
        }
    }

    /** Update the network status. This can be done internally or externally, depending on the scenario. */
    update(networkStatus: NetworkStatus) {
        this.networks.set(networkStatus.networkType, networkStatus);

        // Update the UI with latest network status.
        this.manager.orchestrator.updateNetworkStatus(networkStatus);
    }
}
