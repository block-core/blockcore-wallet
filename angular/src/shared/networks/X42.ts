import { Network } from './network';

export class X42 implements Network {
    singleAddress?: boolean;
    isProofOfStake?: boolean;
    SmartContractSupport: boolean;
    id: string = 'x42';
    name: string = 'x42';
    symbol = 'x42';
    network: number = 424242;
    purpose: number = 84;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'X';
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
}
