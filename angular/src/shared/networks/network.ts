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

    messagePrefix: string;

    bech32: string;

    bip32: { public: number; private: number };

    pubKeyHash: number;

    scriptHash: number;

    wif: number

    /** The default fee on transactions. */
    feeRate?: number;

    /** The minimum fee rate that is allowed. */
    minFeeRate?: number;

    testnet: boolean;

    singleAddress?: boolean;

    /** A logo that can be displayed in UI for the specific network. */
    // logo: ''; 
}