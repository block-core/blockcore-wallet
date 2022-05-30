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

    constructor(private env: EnvironmentService) {
        const networkLoader = new NetworkLoader();
        this.networks = networkLoader.getNetworks(env.networks);
        this.allNetworks = networkLoader.getAllNetworks();
        networkLoader.load().then(() => {
            console.log('Network Loader load completed.');
        });
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

    /** Used to display options on first wallet unlock. User can pick which of these default accounts they want to activate on their wallet. */
    getDefaultAccounts() {
        let accounts: Account[] = [];

        switch (this.env.instance) {
            case Environments.Blockcore:
                accounts = [{
                    identifier: uuidv4(),
                    selected: true,
                    networkType: 'STRAX',
                    mode: 'normal',
                    index: 0,
                    name: 'Stratis',
                    type: 'coin',
                    network: 105105,
                    purpose: 44,
                    purposeAddress: 44,
                    icon: 'paid'
                }, {
                    identifier: uuidv4(),
                    selected: true,
                    networkType: 'CRS',
                    mode: 'normal',
                    index: 0,
                    name: 'Cirrus',
                    type: 'coin',
                    network: 401,
                    purpose: 44,
                    purposeAddress: 44,
                    icon: 'paid'
                }, {
                    identifier: uuidv4(),
                    index: 0,
                    networkType: 'TSTRAX',
                    mode: 'normal',
                    selected: false,
                    name: 'StratisTest',
                    type: 'coin',
                    network: 1,
                    purpose: 44,
                    purposeAddress: 44,
                    icon: 'account_circle'
                }, {
                    identifier: uuidv4(),
                    index: 0,
                    networkType: 'TCRS',
                    mode: 'normal',
                    selected: false,
                    name: 'CirrusTest',
                    type: 'coin',
                    network: 400,
                    purpose: 44,
                    purposeAddress: 44,
                    icon: 'account_circle'
                }
                    // , {
                    //     index: 0,
                    //     name: 'City Coin',
                    //     type: 'coin',
                    //     network: 1926,
                    //     purpose: 44,
                    //     purposeAddress: 44,
                    //     icon: 'paid',
                    //     state: {
                    //         balance: 0,
                    //         retrieved: null,
                    //         receive: [],
                    //         change: []
                    //     },
                    // }, {
                    //     index: 0,
                    //     name: 'Identity',
                    //     type: 'other',
                    //     network: 616,
                    //     purpose: 302,
                    //     purposeAddress: 302,
                    //     icon: 'account_circle',
                    //     state: {
                    //         balance: 0,
                    //         retrieved: null,
                    //         receive: [],
                    //         change: []
                    //     },
                    // }, {
                    //     index: 0,
                    //     name: 'Nostr',
                    //     type: 'other',
                    //     network: 1237,
                    //     purpose: 44,
                    //     purposeAddress: 44, // TODO: Nostr should have custom derived address, add this ability (schnorr signature)
                    //     icon: 'account_circle',
                    //     state: {
                    //         balance: 0,
                    //         retrieved: null,
                    //         receive: [],
                    //         change: []
                    //     },
                    // }
                ];
                break;
            case Environments.CoinVault:
                accounts = [{
                    identifier: uuidv4(),
                    index: 0,
                    networkType: 'STRAX',
                    mode: 'normal',
                    selected: true,
                    name: 'Stratis',
                    type: 'coin',
                    network: 105105,
                    purpose: 44,
                    purposeAddress: 44,
                    icon: 'account_circle'
                }, {
                    identifier: uuidv4(),
                    index: 0,
                    networkType: 'CRS',
                    mode: 'normal',
                    selected: true,
                    name: 'Cirrus',
                    type: 'coin',
                    network: 401,
                    purpose: 44,
                    purposeAddress: 44,
                    icon: 'account_circle'
                }, {
                    identifier: uuidv4(),
                    index: 0,
                    networkType: 'TSTRAX',
                    mode: 'normal',
                    selected: false,
                    name: 'StratisTest',
                    type: 'coin',
                    network: 1,
                    purpose: 44,
                    purposeAddress: 44,
                    icon: 'account_circle'
                }, {
                    identifier: uuidv4(),
                    index: 0,
                    networkType: 'TCRS',
                    mode: 'normal',
                    selected: false,
                    name: 'CirrusTest',
                    type: 'coin',
                    network: 400,
                    purpose: 44,
                    purposeAddress: 44,
                    icon: 'account_circle'
                }];
                break;
            case Environments.SmartCityPlatform:
                accounts = [{
                    identifier: uuidv4(),
                    index: 0,
                    networkType: 'CITY',
                    mode: 'normal',
                    selected: true,
                    name: 'City Coin',
                    type: 'coin',
                    network: 1926,
                    purpose: 44,
                    purposeAddress: 44,
                    icon: 'paid'
                }
                // , {
                //     identifier: uuidv4(),
                //     index: 0,
                //     selected: true,
                //     networkType: 'IDENTITY',
                //     mode: 'normal',
                //     name: 'Identity',
                //     type: 'other',
                //     network: 616,
                //     purpose: 302,
                //     purposeAddress: 302,
                //     icon: 'account_circle',
                //     state: {
                //         balance: 0,
                //         retrieved: null,
                //         receive: [],
                //         change: []
                //     },
                // }, {
                //     identifier: uuidv4(),
                //     index: 0,
                //     networkType: 'NOSTR',
                //     mode: 'normal',
                //     name: 'Nostr',
                //     type: 'other',
                //     network: 1237,
                //     purpose: 44,
                //     purposeAddress: 44, // TODO: Nostr should have custom derived address, add this ability (schnorr signature)
                //     icon: 'account_circle',
                //     state: {
                //         balance: 0,
                //         retrieved: null,
                //         receive: [],
                //         change: []
                //     },
                // }
            ];
                break;
        }

        return accounts;
    }
}
