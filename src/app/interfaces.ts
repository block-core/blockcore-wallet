import { DIDDocument, DIDDocumentMetadata, DIDResolutionMetadata, ServiceEndpoint } from "did-resolver";

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
    theme: string;
    themeColor: string;
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
    sequence: number;
    services: ServiceEndpoint[];
    didDocument?: DIDDocument;
    didResolution?: DIDResolutionResult;
    didPayload?: DIDPayload;
}

interface Vault {
    id: string,
    label?: string;
    published?: boolean;
    icon?: string;
    controller?: string;
    invoker?: string;
    delegator?: string;
    sequence?: number;
    jws?: string;
}

/** EncryptedDocument from the Confidential Storage specification. */
interface VaultEntryEncrypted
{
    id: string;
    sequence: number;
    jwe: any;
}

/** StructuredDocument from the Confidential Storage specification. */
interface VaultEntry {
    id: string;
    meta: { created: Date };
    content: any;
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

interface DIDResolutionMetadataEx extends DIDResolutionMetadata {
    header: any,
    signature: string,
    data: string,
    sequence: number // This is important to have latest of or updates to DID Documents will fail, ordered sequence is required.
}

interface DIDResolutionResult {
    didDocument: any | DIDDocument;
    didDocumentMetadata: DIDDocumentMetadata;
    didResolutionMetadata: DIDResolutionMetadataEx;
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
    Settings,
    Vault
}