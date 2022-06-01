import { Network } from './network';

export class IDENTITY implements Network {
    id: string = 'IDENTITY';
    name: string = 'Identity';
    symbol = 'did:is';
    network: number = 616;
    purpose: number = 302;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'id';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 55;
    scriptHash = 117;
    wif = 0x08;
    testnet = false;
    smartContractSupport = false;
}
