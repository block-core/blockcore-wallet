import { Network } from './network';

export class NOSTR implements Network {
    id: string = 'NOSTR';
    name: string = 'Nostr';
    symbol = 'nostr:key';
    network: number = 1237;
    purpose: number = 44;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'bc';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 0;
    scriptHash = 5;
    wif = 0x08;
    testnet = false;
    smartContractSupport = false;
}
