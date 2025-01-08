import { Network } from './network';

export class CITY implements Network {
    id = 'CITY';
    name = 'City Coin';
    symbol = 'CITY';
    network = 1926;
    purpose = 44;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'city';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 0x1c;
    scriptHash = 0x58;
    wif = 0x08;
    minimumFeeRate = 10;
    maximumFeeRate = 5000;
    testnet = false;
    isProofOfStake = true;
    smartContractSupport = false;
    type = 'coin';
}
