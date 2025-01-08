import { Account } from './interfaces';
import { BITCOIN_TESTNET, BTC, CITY, CRS, CY, IDENTITY, NOSTR, RSC, SBC, STRAX, TCRS, TSTRAX, X42, IMPLX, MOL, KEY, XRC, SERF } from './networks';
import { JWK } from './networks/JWK';
const { v4: uuidv4 } = require('uuid');

export class Defaults {
  static getNetworks() {
    const networks = [];
    networks.push(new BTC());
    networks.push(new CITY());
    networks.push(new CRS());
    networks.push(new CY());
    networks.push(new IDENTITY());
    networks.push(new JWK());
    networks.push(new KEY());
    networks.push(new IMPLX());
    networks.push(new MOL());
    networks.push(new NOSTR());
    networks.push(new RSC());
    networks.push(new SBC());
    networks.push(new STRAX());
    networks.push(new TCRS());
    networks.push(new TSTRAX());
    networks.push(new X42());
    networks.push(new XRC());
    networks.push(new SERF());
    networks.push(new BITCOIN_TESTNET());
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
            networkType: 'BTC',
            mode: 'normal',
            selected: false,
            name: 'Bitcoin',
            type: 'coin',
            network: 0,
            purpose: 44,
            purposeAddress: 44,
            icon: 'paid',
          },
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
            purposeAddress: 340,
            icon: 'account_circle',
          },
          {
            identifier: uuidv4(),
            index: 0,
            networkType: 'BITCOIN_TESTNET',
            mode: 'normal',
            selected: false,
            name: 'Bitcoin Testnet',
            type: 'coin',
            network: 1,
            purpose: 44,
            purposeAddress: 44,
            icon: 'paid',
          }
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
          {
            identifier: uuidv4(),
            index: 0,
            networkType: 'BITCOIN_TESTNET',
            mode: 'normal',
            selected: false,
            name: 'Bitcoin Testnet',
            type: 'coin',
            network: 1,
            purpose: 44,
            purposeAddress: 44,
            icon: 'paid',
          }

        ];
        break;
      case 'freecity':
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
          {
            identifier: uuidv4(),
            index: 0,
            networkType: 'IDENTITY',
            selected: true,
            mode: 'normal',
            name: 'City Chain Identity',
            type: 'identity',
            network: 616,
            purpose: 302,
            purposeAddress: 340, // BIP0340
            icon: 'account_circle',
          }
        ];
        break;
    }

    return accounts;
  }
}
