import { Network } from './network';

export class RSC implements Network {
    singleAddress?: boolean;
    isProofOfStake?: boolean;
    SmartContractSupport: boolean;
    id: string = 'RSC';
    name: string = 'Royal';
    symbol = 'RSC';
    network: number = 6599;
    purpose: number = 84;
    messagePrefix = '\x18RSC Signed Message:\n';
    bech32 = 'rsc';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 60;
    scriptHash = 122;
    wif = 0x08;
    feeRate = 1000000;
    minFeeRate = 1000000;
    testnet = false;
}
