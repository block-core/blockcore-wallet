import { Network } from './network';

export class ION implements Network {
    id = 'IDENTITY';
    name = 'Identity (did:ion)';
    symbol = 'did:ion';
    network = 619;
    purpose = 302;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'ion';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 55;
    scriptHash = 117;
    wif = 0x08;
    testnet = false;
    smartContractSupport = false;
    type = 'identity';
}
