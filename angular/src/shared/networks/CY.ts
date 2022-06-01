import { Network } from './network';

export class CY implements Network {
    id = 'CYBITS';
    name = 'Cybits';
    symbol = 'CY';
    network = 3601;
    purpose = 44;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'cy';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 28;
    scriptHash = 87;
    wif = 0x08;
    feeRate = 0;
    minFeeRate = 0;
    testnet = false;
    smartContractSupport = false;
    isProofOfStake = true;
}
