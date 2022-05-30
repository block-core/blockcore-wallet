import { Injectable } from '@angular/core';
import { NetworkLoader } from '../../shared/network-loader';
import { Network } from '../../shared/networks';
import { Account, Wallet } from '../../shared/interfaces';
import { Environments } from '../../environments/environments';
import { EnvironmentService } from './environment.service';
const { v4: uuidv4 } = require('uuid');

@Injectable({
    providedIn: 'root'
})
export class NetworksService {
    networks: Network[];
    allNetworks: Network[];

    constructor(private env: EnvironmentService, networkLoader: NetworkLoader) {
        this.networks = networkLoader.getNetworks(env.networks);
        this.allNetworks = networkLoader.getAllNetworks();

    }

    getDerivationPathForNetwork(network: Network) {
        return `m/${network.purpose}'/${network.network}'`;;
    }

    getDerivationPathForAccount(account: Account) {
        return `m/${account.purpose}'/${account.network}'/${account.index}'`;;
    }

    /** Get the network definition based upon the id, e.g. BTC, STRAX, CRS, CITY. */
    getNetwork(networkType: string) {
        return this.networks.find(w => w.id == networkType);
    }

    /** Get the network definition based upon the id, e.g. BTC, STRAX, CRS, CITY. The purpose defaults to 44. */
    getNetworkByPurpose(network: number, purpose: number = 44) {
        return this.networks.find(w => w.network == network && w.purpose == purpose);
    }
}
