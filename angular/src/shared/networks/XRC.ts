import { Network } from './network';

export class XRC implements Network {
    id = 'XRC';
    name = 'xRhodium';
    symbol = 'XRC';
    network = 10291;
    purpose = 44;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'rh';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 61;
    scriptHash = 123;
    wif = 0x64;
    minimumFeeRate = 1000;
    maximumFeeRate = 100000000;
    testnet = false;
    smartContractSupport = false;
    isProofOfStake = false;
    type = 'coin';
}
