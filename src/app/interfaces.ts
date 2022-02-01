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

    icon?: string;
    identifier?: string;

    /** Extended Public Key for this account. */
    xpub?: string;
    state?: AccountState;

    /** The type of Account, used to show the account in different sections of the UI. Should be 'coin', 'token' or 'other'. */
    type: string;

    /** Temporary property used for UI-selections. */
    selected?: boolean;
}

interface AccountState {
    /** The latest known balance of this account */
    balance: number | BigInt;

    /** The time when this account data was updated */
    retrieved: string;

    receive: Address[];

    change: Address[];
}

interface Address {
    index: number;
    // change: boolean;

    address: string;
    balance?: BigInt;
    totalReceived?: BigInt;
    totalStake?: BigInt;
    totalMine?: BigInt;
    totalSent?: BigInt;
    totalReceivedCount?: BigInt;
    totalSentCount?: BigInt;
    totalStakeCount?: BigInt;
    totalMineCount?: BigInt;
    pendingSent?: BigInt;
    pendingReceived?: BigInt;

    retrieved?: string;

    transactions?: Transaction[];
    unspent?: UnspentTransactionOutput[]
}

interface UnspentTransactionOutput {
    outpoint: {
        transactionId: string;
        outputIndex: number;
    }
    address: string;
    scriptHex: string;
    value: BigInt | number;
    blockIndex: BigInt | number;
    coinBase: boolean;
    coinStake: boolean;
}

interface Transaction {
    entryType: string;
    transactionHash: string;
    value: BigInt;
    blockIndex: BigInt;
    confirmations: BigInt;
    details: TransactionInfo;
    hex: string;
}

interface TransactionView extends Transaction {
    details: TransactionInfoView;
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

interface TransactionInfoView extends TransactionInfo {
    inputsAmount: BigInt | number;
    outputsAmount: BigInt | number;
    fees: number;

    /** OP_RETURN data available in the outputs */
    data: string[];
}

interface TransactionInput {
    inputIndex: BigInt;
    inputAddress: string;
    inputAmount: number;
    inputTransactionId: string;
    scriptSig: string;
    scriptSigAsm: string;
    witScript: string;
    sequenceLock: string;
}

interface TransactionOutput {
    address: string;
    balance: number;
    index: BigInt;
    outputType: string;
    scriptPubKeyAsm: string;
    scriptPubKey: string;
}

interface Wallet {
    /** Indicates if this wallet was restored or created as new. If the wallet is restored, we will automatically scan the blockchains to data when new accounts are added. */
    restored: boolean;
    id: string;
    name: string;
    // network: string;

    /** Accounts that belong to a wallet. Do not manipulate this list directly, but do all operations through the WalletManager. */
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
    indexer: string;
    dataVault: string;
    autoTimeout: number;
    theme: string;
    themeColor: string;
    language: string;
    /** Allows users to change how the amounts are displayed. */
    amountFormat: string;
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

interface Logger {
    trace(message?: any | (() => any), ...additional: any[]): void;
    debug(message?: any | (() => any), ...additional: any[]): void;
    info(message?: any | (() => any), ...additional: any[]): void;
    log(message?: any | (() => any), ...additional: any[]): void;
    warn(message?: any | (() => any), ...additional: any[]): void;
    error(message?: any | (() => any), ...additional: any[]): void;
    fatal(message?: any | (() => any), ...additional: any[]): void;
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
    TransactionView,
    TransactionInfoView,
    UnspentTransactionOutput,
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
    Logger,
}