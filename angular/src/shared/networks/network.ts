/** Network definitions that holds details about networks and contains providers for address generation and more. */
export interface Network {
  /** Unique identifier for the network, should correspond to same as Blockcore (e.g. STRAX, CRS, CITY) */
  id: string;

  /** Human readable name that is used to show network name to users. */
  name: string;

  /** The unique identifier might not always correspond to the symbol/ticker used, this will be used in the UI. */
  symbol: string;

  /** SLIP44 registered network number. */
  network: number;

  /** Purpose part of the derivation path. This is normally 44 for most use cases. */
  purpose: number;

  /** Used to override the default purpose, which can be different than the purpose used for key derivation. */
  purposeAddress?: number;

  messagePrefix: string;

  bech32: string;

  bip32: { public: number; private: number };

  pubKeyHash: number;

  scriptHash: number;

  wif: number;

  /** The default fee on transactions. */
  feeRate?: number;

  /** The minimum fee rate that is allowed. */
  minFeeRate?: number;

  testnet: boolean;

  singleAddress?: boolean;

  /** Indiciates if this is a Proof-of-Stake v3 network. This must be set for transaction building to work properly. */
  isProofOfStake?: boolean;

  /** A logo that can be displayed in UI for the specific network. */
  // logo: '';

  smartContractSupport: boolean;

  /** Should be either 'coin' or 'identity' */
  type: string;

  sidechains?: NetworkSidechain[];
}

export interface NetworkSidechain {
  name: string;
  symbol: string;
  targetType: string;
  peg: { type: string; address: string };
  confirmations?: { low: number; high?: number; count: number }[];
}
