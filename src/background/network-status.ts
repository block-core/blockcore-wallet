import { BehaviorSubject } from 'rxjs';
import { Account, NetworkStatus } from '../app/interfaces';
import { Network, BTC44, BTC84, CITY, CRS, IDENTITY, NOSTR, STRAX, TSTRAX, TCRS } from './networks';

export class NetworkStatusManager {
    private networks: Network[] = [];

    public networks$ = new BehaviorSubject<NetworkStatus[]>([]);

    constructor() {
        this.createNetworks();
    }

    /** Will attempt to query all the networks that are used in active wallet. */
    async updateAll(accounts: Account[]): Promise<NetworkStatus[]> {
        for (let i = 0; i < accounts.length; i++) {


        }

        const statuses: NetworkStatus[] = [];

        try {

        } catch (err) {

        }

        return statuses;
        // this.networks$.next(statuses);
    }

    /** Returns a list of networks that correspond to the filter supplied. */
    getNetworks(filter: string[]) {
        // When the filter is empty, we'll return the full list.
        if (filter.length == 0) {
            return this.networks;
        }

        return this.networks.filter((network) => {
            return filter.includes(network.id);
        });
    }

    getAllNetworks() {
        return this.networks;
    }

    createNetworks() {
        this.networks.push(new STRAX());
        this.networks.push(new CRS());
        this.networks.push(new TSTRAX());
        this.networks.push(new TCRS());
        this.networks.push(new CITY());
        this.networks.push(new IDENTITY());
        this.networks.push(new NOSTR());
        this.networks.push(new BTC44());
        this.networks.push(new BTC84());
    }
}
