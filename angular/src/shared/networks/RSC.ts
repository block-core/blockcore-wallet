import { Network } from './network';

export class RSC implements Network {
    id = 'RSC';
    name = 'Royal Sports City';
    symbol = 'RSC';
    network = 6599;
    purpose = 44;
    purposeAddress = 84;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'rsc';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 60;
    scriptHash = 122;
    wif = 0x08;
    minimumFeeRate = 1000;
    maximumFeeRate = 500000;
    testnet = false;
    smartContractSupport = false;
    isProofOfStake = true;
    type = 'coin';
}
