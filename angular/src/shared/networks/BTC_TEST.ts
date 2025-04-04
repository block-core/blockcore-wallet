import { Network } from './network';

/* This is the configuration for testnet3
TODO: Address generation works correctly, but for full functionality indexer has to be updated */
export class BITCOIN_TESTNET implements Network {
    id = 'BITCOIN_TESTNET';
    name = 'Bitcoin Testnet';
    symbol = 'BTC_TEST';
    network = 1;
    purpose = 44;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'tb';
    bip32 = {
        public: 0x043587cf,
        private: 0x04358394,
    };
    pubKeyHash = 0x6f;
    scriptHash = 0xc4;
    wif = 0xef;
    minimumFeeRate = 1;
    maximumFeeRate = 1000;
    testnet = true;
    isProofOfStake = false;
    smartContractSupport = false;
    type = 'coin';

    explorer = {
        url: 'https://test.explorer.angor.io/',
        tx: 'tx/',
        address: 'address/',
    };
}
