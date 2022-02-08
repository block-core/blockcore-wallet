import { Account, NetworkStatus } from '../app/interfaces';

export class NetworkStatusManager {
    constructor() {
    }

    /** Will attempt to query all the networks that are used in active wallet. */
    async updateAll(accounts: Account[]): Promise<NetworkStatus[]> {
        const statuses: NetworkStatus[] = [];

        for (let i = 0; i < accounts.length; i++) {
            try {

            } catch (err) {

            }
        }

        return statuses;
    }
}
