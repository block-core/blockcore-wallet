import { Network } from './network';

export class IMPLX implements Network {
  id = 'IMPLX';
  name = 'ImpleumX';
  symbol = 'IMPLX';
  network = 701;
  purpose = 44;
  messagePrefix = '\x18Bitcoin Signed Message:\n';
  bech32 = 'implx';
  bip32 = {
    public: 0x0488b21e,
    private: 0x0488ade4,
  };
  pubKeyHash = 76;
  scriptHash = 141;
  wif = 0x08;
  minimumFeeRate = 10;
  maximumFeeRate = 5000;
  testnet = false;
  isProofOfStake = true;
  smartContractSupport = false;
  type = 'coin';
}
