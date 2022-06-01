import { Network } from './network';

export class SBC implements Network {
    id = 'SBC';
    name = 'Senior Blockchain';
    symbol = 'SBC';
    network = 5006;
    purpose = 44;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'sbc';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 63;
    scriptHash = 125;
    wif = 0x08;
    feeRate = 10000;
    minFeeRate = 10000;
    testnet = false;
    smartContractSupport = false;
    isProofOfStake = true;
}
