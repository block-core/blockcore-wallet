import { Injectable } from '@angular/core';
import { NetworkStatusStore } from 'src/shared';
import { Account, IndexerApiStatus, NetworkStatus, NetworkStatusEntry } from '../../shared/interfaces';
import { EnvironmentService } from './environment.service';
import { NetworkLoader } from '../../shared/network-loader';
import { Network } from '../../shared/networks';
import { SettingsService } from './settings.service';
import { WalletManager } from './wallet-manager';
import { FEE_FACTOR, SATOSHI_FACTOR, STATUS_INTERVAL } from '../shared/constants';
import { LoggerService } from './logger.service';
import { NetworksService } from './networks.service';
const axios = require('axios').default;

@Injectable({
    providedIn: 'root'
})
export class NetworkStatusService {
    allNetworks: Network[];
    availableNetworks: Network[];

    constructor(
        private networkLoader: NetworkLoader,
        private env: EnvironmentService,
        private logger: LoggerService,
        private store: NetworkStatusStore,
        private networkService: NetworksService,
        private walletManager: WalletManager,
        private settings: SettingsService) {

    }

    async initialize() {
        // This is the network status instances
        const existingNetworkState = this.store.all();

        // Keep a local state of all networks that exists. We'll use this to allow get operations
        // that always work, even when a certain network is disabled in the UI.
        this.allNetworks = this.networkLoader.getAllNetworks();

        // Get an instance of the Network object for all activated networks on this instance.
        this.availableNetworks = this.networkLoader.getNetworks(this.env.networks);

        // Go through all available networks and get the status, if available.
        // this.availableNetworks.forEach(n => {
        //     const existingState = existingNetworkState.find(e => e.networkType == n.id);

        //     if (existingState) {
        //         this.store.set(n.id, existingState);
        //     } else {
        //         this.store.set(n.id, <NetworkStatus>{ networkType: n.id, availability: IndexerApiStatus.Unknown });
        //     }
        // });
    }

    /** Get the network definition based upon the network identifier. */
    getNetwork(networkType: string) {
        return this.allNetworks.find(w => w.id == networkType);
    }

    /** Get the network definition based upon the network number and purpose. The purpose defaults to 44. */
    getNetworkByPurpose(network: number, purpose: number = 44) {
        return this.allNetworks.find(w => w.network == network && w.purpose == purpose);
    }

    getAll() {
        return this.store.all();
    }

    getActive(): NetworkStatusEntry[] {
        const accounts = this.walletManager.activeWallet.accounts;
        const uniqueAccountTypes = accounts.filter((value, index, self) => self.map(x => x.networkType).indexOf(value.networkType) == index).map(m => m.networkType);

        let items: NetworkStatusEntry[] = [];

        for (let i = 0; i < uniqueAccountTypes.length; i++) {
            const type = uniqueAccountTypes[i];

            items.push({
                type,
                networks: this.store.get(type)
            });
        }

        return items;
    }

    get(networkType: string) {
        return this.store.get(networkType);
    }
}
