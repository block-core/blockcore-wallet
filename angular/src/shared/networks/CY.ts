import { Network } from './network';

export class CY implements Network {
    singleAddress?: boolean;
    isProofOfStake?: boolean;
    SmartContractSupport: boolean;
    id: string = 'CY';
    name: string = 'Cybits';
    symbol = 'CY';
    network: number = 3601;
    purpose: number = 84;
    messagePrefix = '\x18Cybits Signed Message:\n';
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
}
