import { Network } from './network';

export class CRS implements Network {
    id = 'CRS';
    name = 'Cirrus';
    symbol = 'CRS';
    network = 401;
    purpose = 44;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'tb';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 28;
    scriptHash = 88;
    wif = 0x08; // TODO: Verify if this is still used for CRS.
    feeRate = 10000;
    minFeeRate = 10000;
    testnet = false;
    singleAddress = true;
    smartContractSupport = true;
    type = 'coin';
    sidechains = [
        {
          name: "Stratis",
          symbol: "STRAX",
          targetType: "mainchain",
          peg:{
            type:"Federation",
            address:"cYTNBJDbgjRgcKARAvi2UCSsDdyHkjUqJ2"
         },
         confirmations: [{ low: 0, high: 50, count: 30 }, { low: 50, high: 1000, count: 70 }, { low: 1000, count: 140 }]
        }
      ];
}
