import { Network } from './network';

export class MOL implements Network {
  id = 'MOL';
  name = 'Molie';
  symbol = 'MOL';
  network = 772;
  purpose = 44;
  messagePrefix = '\x18Bitcoin Signed Message:\n';
  bech32 = 'mol';
  bip32 = {
    public: 0x0488B21E,
    private: 0x0488ADE4,
  };
  pubKeyHash = 51;
  scriptHash = 141;
  wif = 0x08;
  feeRate = 10000;
  minFeeRate = 10000;
  testnet = false;
  isProofOfStake = true;
  smartContractSupport = false;
  type = 'coin';
}
