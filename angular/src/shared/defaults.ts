import { Account } from './interfaces';
import { BTC, CITY, CRS, CY, IDENTITY, NOSTR, RSC, SBC, STRAX, TCRS, TSTRAX, X42 , IMPLX, KEY} from './networks';
const { v4: uuidv4 } = require('uuid');

export class Defaults {
  static getNetworks() {
    const networks = [];
    networks.push(new BTC());
    networks.push(new CITY());
    networks.push(new CRS());
    networks.push(new CY());
    networks.push(new IDENTITY());
    networks.push(new KEY());
    networks.push(new IMPLX());
    networks.push(new NOSTR());
    networks.push(new RSC());
    networks.push(new SBC());
    networks.push(new STRAX());
    networks.push(new TCRS());
    networks.push(new TSTRAX());
    networks.push(new X42());
    return networks;
  }

  static getDefaultAccounts(instance: string) {
    let accounts: Account[] = [];

    switch (instance) {
      case 'blockcore':
        accounts = [
          {
            identifier: uuidv4(),
            index: 0,
            networkType: 'CITY',
            mode: 'normal',
            selected: false,
            name: 'City Coin',
            type: 'coin',
            network: 1926,
            purpose: 44,
            purposeAddress: 44,
            icon: 'paid',
          },
          {
            identifier: uuidv4(),
            selected: false,
            networkType: 'CRS',
            mode: 'normal',
            index: 0,
            name: 'Cirrus',
            type: 'coin',
            network: 401,
            purpose: 44,
            purposeAddress: 44,
            icon: 'paid',
          },
          {
            identifier: uuidv4(),
            index: 0,
            networkType: 'CY',
            mode: 'normal',
            selected: false,
            name: 'Cybits',
            type: 'coin',
            network: 3601,
            purpose: 44,
            purposeAddress: 84,
            icon: 'paid',
          },
          {
            identifier: uuidv4(),
            selected: false,
            networkType: 'IMPLX',
            mode: 'normal',
            index: 0,
            name: 'Impleum',
            type: 'coin',
            network: 701,
            purpose: 44,
            purposeAddress: 44,
            icon: 'paid',
          },
          {
            identifier: uuidv4(),
            index: 0,
            networkType: 'RSC',
            mode: 'normal',
            selected: false,
            name: 'Royal Sports City',
            type: 'coin',
            network: 6599,
            purpose: 44,
            purposeAddress: 84,
            icon: 'paid',
          },
          {
            identifier: uuidv4(),
            index: 0,
            networkType: 'SBC',
            mode: 'normal',
            selected: false,
            name: 'Senior Blockchain',
            type: 'coin',
            network: 5006,
            purpose: 44,
            purposeAddress: 84,
            icon: 'paid',
          },
          {
            identifier: uuidv4(),
            selected: false,
            networkType: 'STRAX',
            mode: 'normal',
            index: 0,
            name: 'Stratis',
            type: 'coin',
            network: 105105,
            purpose: 44,
            purposeAddress: 44,
            icon: 'paid',
          },
          {
            identifier: uuidv4(),
            index: 0,
            networkType: 'X42',
            mode: 'normal',
            selected: false,
            name: 'X42',
            type: 'coin',
            network: 424242,
            purpose: 44,
            purposeAddress: 44,
            icon: 'paid',
          },
          {
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
            icon: 'account_circle',
          },
          {
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
            icon: 'account_circle',
          },
          {
            identifier: uuidv4(),
            index: 0,
            networkType: 'IDENTITY',
            selected: false,
            mode: 'normal',
            name: 'Identity',
            type: 'identity',
            network: 616,
            purpose: 302,
            purposeAddress: 340, // BIP0340
            icon: 'account_circle',
          },
          {
            identifier: uuidv4(),
            index: 0,
            networkType: 'NOSTR',
            selected: false,
            mode: 'normal',
            name: 'Nostr',
            type: 'identity',
            network: 1237,
            purpose: 44,
            purposeAddress: 340, // BIP0340
            icon: 'account_circle',
          },
        ];
        break;
      case 'coinvault':
        accounts = [
          {
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
            icon: 'account_circle',
          },
          {
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
            icon: 'account_circle',
          },
          {
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
            icon: 'account_circle',
          },
          {
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
            icon: 'account_circle',
          },
        ];
        break;
      case 'smartcityplatform':
        accounts = [
          {
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
            icon: 'paid',
          },
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
