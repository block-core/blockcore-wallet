import { Network, Strax } from './networks';

/** Loads the  */
export class NetworkLoader {

    networks: Network[] = [];

    constructor() {
        
    }

    createNetworks() {
        this.networks.push(new Strax());
        this.networks.push(new Strax());
    }

}