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

    /** The default derivation path displayed and editable when creating a new account. */
    derivationPath: string;

    messagePrefix: string;

    bech32: string;

    bip32: { public: number; private: number };

    pubKeyHash: number;

    scriptHash: number;

    wif: number

    /** A logo that can be displayed in UI for the specific network. */
    // logo: ''; 
}