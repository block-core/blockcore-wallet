import { Network } from './network';

export class TCRS implements Network {
    id = 'TCRS';
    name = 'CirrusTest';
    symbol = 'TCRS';
    network = 400;
    purpose = 44;
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
    smartContractSupport = true;
    type = 'coin';
    sidechains = [
        {
          name: "Stratis Test",
          symbol: "TSTRAX",
          targetType: "mainchain",
          peg:{
            type:"Federation",
            address:"xHtgXLa3CSjAVtmydqNrrMU7nZw7qdq2w6"
         },
         confirmations: [{ low: 0, high: 50, count: 25 }, { low: 50, high: 1000, count: 80 }, { low: 1000, count: 500 }]
        }
      ];
}
