import { DIDDocument, DIDDocumentMetadata, ServiceEndpoint } from "did-resolver";

// interfaces.ts
interface IWords {
    [key: string]: string;
}

interface INumbers {
    [key: string]: number;
}

interface IBooleans {
    [key: string]: boolean;
}

interface IValues {
    [key: string]: string | number;
}

interface IStructures {
    [key: string]: INumbers | IBooleans | IValues;
}

interface Account {
    name: string | undefined;
    network: number;
    index: number;
    purpose: number;
    derivationPath: string;
    icon?: string;
    identifier?: string;
}

interface Wallet {
    id: string;
    name: string;
    // network: string;
    accounts: Account[];
    mnemonic: string;
    activeAccountIndex: number;
}

interface Persisted {
    // wallets: Map<string, Wallet>
    wallets: Wallet[]
    activeWalletId: string | undefined | null
    // autoTimeout: number
    settings: Settings
    // wallets: Wallet[],
    // activeWalletIndex: number;
    // activeAccountIndex: number
}

interface Settings {
    dataVault: string;
    autoTimeout: number;
}

interface Action {
    action?: string;
    document?: string;
    tabId?: string;
}

interface State {
    action?: Action
    persisted: Persisted
    store: Store
    unlocked: string[]
}

interface Store {
    identities: Identity[] // Contains the users own identities and queries/cached identities.
    cache: {
        identities: Identity[]
    }
}

interface Identity {
    id: string,
    published: boolean;
    services: ServiceEndpoint[];
    didDocument?: DIDDocument;
    didResolution?: any | DIDResolutionResult;
    didPayload?: DIDPayload;
}

interface DIDPayload {
    /** Base64 encoded and signed JWS of the DID Document. */
    data: string;

    /** Decoded JWS header. */
    header: {
        alg: string;
        issuer: string;
    }

    payload: DIDDocument;

    /** The isolated signature from the JWS. */
    signature: string
}

interface DIDDocumentMetadataEx extends DIDDocumentMetadata {
    header: any,
    signature: string,
    data: string,
    sequence: number // This is important to have latest of or updates to DID Documents will fail, ordered sequence is required.
}

interface DIDResolutionResult {
    didDocument: any | DIDDocument;
    didDocumentMetadata: DIDDocumentMetadataEx;
    didResolutionMetadata: any;
}

export {
    // not exporting IWords | INumbers
    IBooleans,
    IValues,
    IStructures,
    Account,
    Wallet,
    Persisted,
    State,
    Action,
    Store,
    Identity,
    DIDResolutionResult,
    DIDPayload,
    Settings
}