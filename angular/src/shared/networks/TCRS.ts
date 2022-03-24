import { Network } from './network';

export class TCRS implements Network {
    id: string = 'TCRS';
    name: string = 'CirrusTest';
    symbol = 'TCRS';
    network: number = 400;
    purpose: number = 44;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'tb';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 127;
    scriptHash = 137;
    wif = 0x08; // TODO: Verify if this is still used for CRS.
    feeRate = 10000;
    minFeeRate = 10000;
    testnet = true;
    singleAddress = true;
}
