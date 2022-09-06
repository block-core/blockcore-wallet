import { Network } from './network';

export class STRAX implements Network {
    id = 'STRAX';
    name = 'Stratis';
    symbol = 'STRAX';
    network = 105105;
    purpose = 44;
    messagePrefix = '\x18Bitcoin Signed Message:\n';
    bech32 = 'strax';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 75;
    scriptHash = 140;
    wif = 0x08;
    feeRate = 10000;
    minFeeRate = 10000;
    testnet = false;
    smartContractSupport = false;
    type = 'coin';
    sidechains = [
        {
          name : "Cirrus",
          symbol : "CRS",
          targetType : "sidechain",
          peg : {
            type : "Federation",
            address : "yU2jNwiac7XF8rQvSk2bgibmwsNLkkhsHV"
         },
         confirmations: [{ low: 0, high: 50, count: 25 }, { low: 50, high: 1000, count: 80 }, { low: 1000, count: 500 }]
        }
      ];
}
