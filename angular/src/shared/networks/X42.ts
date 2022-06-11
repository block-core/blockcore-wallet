import { Network } from './network';

export class X42 implements Network {
    id = 'X42';
    name = 'X42';
    symbol = 'x42';
    network = 424242;
    purpose = 44;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'x42';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 75;
    scriptHash = 125;
    wif = 0x08;
    feeRate = 0;
    minFeeRate = 0;
    testnet = false;
    smartContractSupport = false;
    isProofOfStake = true;
    type = 'coin';
}
