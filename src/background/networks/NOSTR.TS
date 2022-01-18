import { Network } from './network';

export class NOSTR implements Network {
    id: string = 'NOSTR';
    name: string = 'Nostr';
    symbol = 'nostr:key';
    bech32 = 'bc';
    network: number = 1237;
    purpose: number = 44;
    derivationPath: string = `m/44'/1237'/0'`;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 0;
    scriptHash = 5;
    wif = 0x08;
}
