import { Network } from './network';

export class BTC44 implements Network {
    id: string = 'BTC';
    name: string = 'Bitcoin (1addresses)';
    symbol = 'BTC';
    bech32 = 'bc';
    network: number = 0;
    purpose: number = 44;
    derivationPath: string = `m/44'/0'/0'`;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 0;
    scriptHash = 5;
    wif = 0x08;
    feeRate = '0.00010000';
}

export class BTC49 implements Network {
    id: string = 'BTC';
    name: string = 'Bitcoin (3addresses)';
    symbol = 'BTC';
    bech32 = 'bc';
    network: number = 0;
    purpose: number = 49;
    derivationPath: string = `m/49'/0'/0'`;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 0;
    scriptHash = 5;
    wif = 0x08;
    feeRate = '0.00010000';
}

export class BTC84 implements Network {
    id: string = 'BTC';
    name: string = 'Bitcoin (bc1addresses)';
    symbol = 'BTC';
    bech32 = 'bc';
    network: number = 0;
    purpose: number = 84;
    derivationPath: string = `m/84'/0'/0'`;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 0;
    scriptHash = 5;
    wif = 0x08;
    feeRate = '0.00010000';
}
