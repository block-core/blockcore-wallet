import { Network } from './network';

export class STRAX implements Network {
    id: string = 'STRAX';
    name: string = 'Stratis';
    symbol = 'STRAX';
    network: number = 105105;
    purpose: number = 44;
    derivationPath: string = `m/44'/105105'/0'`;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'strax';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 75;
    scriptHash = 140;
    wif = 0x08;
}
