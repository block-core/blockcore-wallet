import { address } from "bitcoinjs-lib";
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

/** The user account, most of this data should be considered immutable. The index, etc. should never change after creation. See "AccountState" to get balance, 
 * transaction history, addresses and more. */
interface Account {
    name: string | undefined;
    network: number;
    index: number;

    /** This is the actual purpose that should be used to derive keys */
    purpose: number;

    /** This is the purpose of address types, which can be used to override the default (44, 49, 84). 
     * Some Blockcore chains have used same derivatoin path for different address formats, and this property allows overriding the default.
     */
    purposeAddress: number;

    derivationPath: string;
    icon?: string;
    identifier?: string;

    /** Extended Public Key for this account. */
    xpub?: string;
    state?: AccountState;
}

interface AccountState {
    /** The latest known balance of this account */
    balance: BigInt;

    /** The time when this account data was updated */
    retrieved: Date;

    addresses: Address[];
}

interface Address {
    index: number;
    change: boolean;

    address: string;
    balance: BigInt;
    totalReceived: BigInt;
    totalStake: BigInt;
    totalMine: BigInt;
    totalSent: BigInt;
    totalReceivedCount: BigInt;
    totalSentCount: BigInt;
    totalStakeCount: BigInt;
    totalMineCount: BigInt;
    pendingSent: BigInt;
    pendingReceived: BigInt;

    transactions: Transaction[];
}

interface Transaction {
    entryType: ['send', 'receive'];
    transactionHash: string;
    value: BigInt;
    blockIndex: BigInt;
    confirmations: BigInt;
    details: TransactionInfo;
}

interface TransactionInfo {
    symbol: string;
    blockHash: string;
    blockIndex: BigInt;
    timestamp: BigInt;
    transactionId: string;
    confirmations: BigInt;
    isCoinbase: boolean;
    isCoinstake: boolean;
    lockTime: string;
    rbf: boolean;
    version: BigInt;
    inputs: TransactionInput[];
    outputs: TransactionOutput[];
}

interface TransactionInput {
    inputIndex: BigInt;
    inputAddress: string;
    inputAmount: BigInt;
    inputTransactionId: string;
    scriptSig: string;
    scriptSigAsm: string;
    witScript: string;
    sequenceLock: string;
}

interface TransactionOutput {
    address: string;
    balance: BigInt;
    index: BigInt;
    outputType: string;
    scriptPubKeyAsm: string;
    scriptPubKey: string;
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
    language: string;
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
interface VaultEntryEncrypted {
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
    AccountState,
    Address,
    Transaction,
    TransactionInfo,
    TransactionInput,
    TransactionOutput,
    Wallet,
    Persisted,
    State,
    Action,
    Store,
    Identity,
    DIDResolutionResult,
    DIDPayload,
    Settings,
    Vault,
}