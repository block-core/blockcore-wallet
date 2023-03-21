import { Network } from './network';

export class SERF implements Network {
  id: string = 'SERF';
  name: string = 'SERF';
  symbol = 'SERF';
  network: number = 712;
  purpose: number = 44;
  messagePrefix = '\x18Bitcoin Signed Message:\n';
  bech32 = 'serf';
  bip32 = {
    public: 0x0488b21e,
    private: 0x0488ade4,
  };
  pubKeyHash = 63;
  scriptHash = 110;
  wif = 0x08;
  feeRate = 10000;
  minFeeRate = 10000;
  testnet = false;
  smartContractSupport = false;
  isProofOfStake = true;
  type = 'coin';
}
