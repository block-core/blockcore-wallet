import { Network } from './network';

export class BTC44 implements Network {
    id: string = 'BTC';
    name: string = 'Bitcoin (Legacy)';
    symbol = 'BTC';
    bech32 = 'bc';
    network: number = 0;
    purpose: number = 44;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 0;
    scriptHash = 5;
    wif = 0x08;
    feeRate = '0.00010000';
    testnet = false;
}

// WE DO NOT SUPPORT THESE ADDRESS TYPES AS THEY WAS TRANSITIONAL.
// export class BTC49 implements Network {
//     id: string = 'BTC';
//     name: string = 'Bitcoin (3addresses)';
//     symbol = 'BTC';
//     bech32 = 'bc';
//     network: number = 0;
//     purpose: number = 49;
//     messagePrefix = '\x18Bitcoin Signed Message:\n';
//     bip32 = {
//         public: 0x0488b21e,
//         private: 0x0488ade4,
//     };
//     pubKeyHash = 0;
//     scriptHash = 5;
//     wif = 0x08;
//     feeRate = '0.00010000';
// }

export class BTC84 implements Network {
    id: string = 'BTC';
    name: string = 'Bitcoin (Segwit)';
    symbol = 'BTC';
    bech32 = 'bc';
    network: number = 0;
    purpose: number = 84;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 0;
    scriptHash = 5;
    wif = 0x08;
    feeRate = '0.00010000';
    testnet = false;
}
