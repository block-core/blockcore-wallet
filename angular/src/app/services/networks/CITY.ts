import { Network } from './network';

export class CITY implements Network {
    id: string = 'CITY';
    name: string = 'City Chain';
    symbol = 'CITY';
    network: number = 1926;
    purpose: number = 44;
    messagePrefix = '\x18CityCoin Signed Message:\n'; // TODO: City Chain should migrate to use same prefix as Bitcoin.
    bech32 = 'city';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 0x1c;
    scriptHash = 0x58;
    wif = 0x08;
    feeRate = '0.00010000';
    testnet = false;
}
