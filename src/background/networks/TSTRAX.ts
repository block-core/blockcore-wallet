import { Network } from './network';

export class TSTRAX implements Network {
    id: string = 'TSTRAX';
    name: string = 'StratisTest';
    symbol = 'TSTRAX';
    network: number = 105105;
    purpose: number = 44;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'tstrax';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 120;
    scriptHash = 127;
    wif = 0x08;
    feeRate = '0.00010000';
    testnet = true;
}
