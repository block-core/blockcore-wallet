import { BTC44, BTC49, BTC84, CITY, CRS, IDENTITY, Network, NOSTR, STRAX } from './networks';

/** Holds a list of networks that is available. */
export class NetworkLoader {
    private networks: Network[] = [];

    constructor() {

    }

    /** Returns a list of networks that correspond to the filter supplied. */
    getNetworks(filter: string[]) {
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
        this.networks.push(new CITY());
        this.networks.push(new IDENTITY());
        this.networks.push(new NOSTR());
        this.networks.push(new BTC44());
        this.networks.push(new BTC84());
        this.networks.push(new BTC49());
    }
}
