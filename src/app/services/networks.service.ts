import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import * as bip39 from 'bip39';
import { Base64 } from 'js-base64';
import { NetworkLoader } from '../../background/network-loader';
import { Network } from '../../background/networks';

@Injectable({
    providedIn: 'root'
})
export class NetworksService {

    networks: Network[];
    allNetworks: Network[];

    constructor() {
        const networkLoader = new NetworkLoader();
        this.networks = networkLoader.getNetworks(environment.networks);
        this.networks = networkLoader.getAllNetworks();
    }

    /** Get the network definition based upon the id, e.g. BTC, STRAX, CRS, CITY. */
    getNetworkById(id: string) {
        const network = this.networks.find(w => w.id == id);
        return network;
    }

    /** Get the network definition based upon the id, e.g. BTC, STRAX, CRS, CITY. The purpose defaults to 44. */
    getNetwork(network: number, purpose: number = 44) {
        return this.networks.find(w => w.network == network && w.purpose == purpose);
    }
}
