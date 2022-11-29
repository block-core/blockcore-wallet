import { Network } from './network';

export class JWK implements Network {
    id = 'JWK';
    name = 'Identity (did:jwk)';
    symbol = 'did:jwk';
    network = 617;
    purpose = 302;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'jwk';
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
