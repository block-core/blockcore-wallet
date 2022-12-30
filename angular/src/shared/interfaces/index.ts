import { DIDDocument, DIDDocumentMetadata, DIDResolutionMetadata, ServiceEndpoint } from 'did-resolver';
import { ClientData } from './client-data';
import { DecodedAttestion } from './decoded-attestion';
import { User, Credential } from './user';

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

enum IndexerApiStatus {
  Unknown = 0,
  Online = 1,
  Offline = 2,
  Syncing = 3,
  Error = 4,
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface IEnvironment {
  production: boolean;

  // Enables use of ng.profiler.timeChangeDetection(); in browser console
  enableDebugTools: boolean;
  logLevel: LogLevel;
  features: string[];
  releaseUrl: string;
  sourceUrl: string;
  instance: string;
  instanceName: string;
  instanceUrl: string;
  instanceExplorerUrl: string;
  networks: string[];
}

interface NetworkStatus {
  domain: string;
  url: string;
  blockSyncHeight?: number;
  networkType: string;
  status: string;
  availability: IndexerApiStatus;
  relayFee: number;
}

interface CoinSelectionResult {
  fee: number;
  inputs: CoinSelectionInput[];
  outputs: CoinSelectionOutput[];
}

interface CoinSelectionInput {
  address: string;
  nonWitnessUtxo?: Buffer;
  txId: string;
  value: number;
  vout: number;
}

interface CoinSelectionOutput {
  address: string;
  value: number;
  script: any;
}

interface NetworkStatusEntry {
  type: string;
  selectedDomain: string;
  networks: NetworkStatus[];
}

/** The user account, most of this data should be considered immutable. The index, etc. should never change after creation. See "AccountState" to get balance,
 * transaction history, addresses and more. */
interface Account {
  name: string | undefined;

  /** The unique identifier for this network. */
  networkType: string;

  /** Latest status of this network. */
  // networkStatus?: string;

  network: number;

  index: number;

  /** This is the actual purpose that should be used to derive keys */
  purpose: number;

  /** This is the purpose of address types, which can be used to override the default (44, 49, 84).
   * Some Blockcore chains have used same derivatoin path for different address formats, and this property allows overriding the default.
   */
  purposeAddress: number;

  icon?: string;

  /** The unique identifier for this account. */
  identifier: string;

  /** Extended Public Key for this account. */
  xpub?: string;

  /** Imported private key for this account. */
  prv?: string;

  /** When the account is created, the DID is generated and never changes. */
  // did?: string;

  // state?: AccountState;

  /** The type of Account, used to show the account in different sections of the UI. Should be 'coin', 'token' or 'other'. */
  type: string;

  /** Account mode indicates if this is a full (normal) or quick (basic) type of account. */
  mode: string;

  /** Indicates if this account should only use the primary key pair. */
  singleAddress?: boolean;

  /** Temporary property used for UI-selections. */
  selected?: boolean;
}

interface AccountState {
  /** The unique identifier of the account that this state belongs to. */
  id: string;

  /** The latest known balance of this account */
  balance: number;

  /** The time when this account data was updated */
  retrieved?: string;

  /** The total amount of pending received on this account */
  pendingReceived?: number;

  /** The total amount of pending sent on this account. */
  pendingSent?: number;

  /** All the known used and one unused receive address. */
  receive: Address[];

  /** All the known used and one unused change address. */
  change: Address[];

  /** The last date in ISO format the account was scanned for changes. */
  lastScan?: string;

  /** Indicates if the scan has been completed. */
  completedScan?: boolean;
}

interface Address {
  index: number;
  // change: boolean;

  address: string;
  balance?: number;
  totalReceived?: number;
  totalStake?: number;
  totalMine?: number;
  totalSent?: number;
  totalReceivedCount?: number;
  totalSentCount?: number;
  totalStakeCount?: number;
  totalMineCount?: number;
  pendingSent?: number;
  pendingReceived?: number;

  retrieved?: string;

  transactions?: Transaction[];
  unspent?: UnspentTransactionOutput[];
}

interface Transaction {
  entryType: string;
  transactionHash: string;
  value: number;
  blockIndex: number;
  confirmations: number;
  details: TransactionInfo;
  hex: string;
  unconfirmed?: boolean;
  finalized?: boolean;
}

interface TransactionMetadata {
  accountId: string;
  transactions: TransactionMetadataEntry[];
}

interface TransactionMetadataEntry {
  transactionHash: string;
  memo: string;
  payment?: {
    label: string;
    message: string;
    id: string;
  };
}

interface TransactionView extends Transaction {
  details: TransactionInfoView;
}

interface AddressState {
  /** The address */
  address: string;

  /** The current offset that has been queried. This will only proceed forward when the entry has 500 confirmations. */
  offset: number;

  /** The history of transactions that exists on this address.
   * These are only the transaction IDs, to reduce storage usage,
   * as same transaction can be involved with multiple wallet addresses. */
  transactions: string[];
}

/** The pre-indexed state of address retreived from indexer API. */
interface AddressIndexedState {
  address: string;
  balance?: number;
  totalReceived?: number;
  totalStake?: number;
  totalMine?: number;
  totalSent?: number;
  totalReceivedCount?: number;
  totalSentCount?: number;
  totalStakeCount?: number;
  totalMineCount?: number;
  pendingSent?: number;
  pendingReceived?: number;
  offset?: number;
}

interface TransactionInfo {
  fee: number;
  symbol: string;
  blockHash: string;
  blockIndex: number;
  timestamp: number;
  transactionId: string;
  confirmations: number;
  isCoinbase: boolean;
  isCoinstake: boolean;
  lockTime: string;
  rbf: boolean;
  version: number;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
}

interface TransactionHistory {
  calculatedValue: number;
  calculatedAddress: string;
  entryType: string;
  fee: number;
  unconfirmed?: boolean;
  finalized?: boolean;
  transactionHash: string;
  isCoinbase: boolean;
  isCoinstake: boolean;
  isSidechain: boolean;
  timestamp: number;
  blockIndex: number;
  hasContract?: boolean;
}

interface UnspentTransactionOutput {
  outpoint: {
    transactionId: string;
    outputIndex: number;
  };
  address: string;
  scriptHex: string;
  value: number;
  blockIndex: number;
  coinBase: boolean;
  coinStake: boolean;
}

interface AccountUnspentTransactionOutput {
  address: string;
  balance: number;
  index: number;
  transactionHash: string;
  unconfirmed: boolean;
  hex: string;

  /** Local state indicator if this UTXO has been used by the user and shouldn't be included in other transactions. */
  spent?: boolean;
}

interface AccountHistory {
  balance: number;
  unconfirmed: number;
  history: TransactionHistory[];
  unspent: AccountUnspentTransactionOutput[];
}

interface TransactionInfoView extends TransactionInfo {
  inputsAmount: number;
  outputsAmount: number;
  fees: number;

  /** OP_RETURN data available in the outputs */
  data: string[];
}

interface TransactionInput {
  inputIndex: number;
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
  index: number;
  outputType: string;
  scriptPubKeyAsm: string;
  scriptPubKey: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  address: string;
  network: string;
  // addresses: ContactAddress[];
}

interface ContactAddress {
  address: string;
  network: any;
}

interface Wallet {
  /** Indicates if this wallet was restored or created as new. If the wallet is restored, we will automatically scan the blockchains to data when new accounts are added. */
  restored: boolean;
  id: string;
  name: string;
  // network: string;

  /** Accounts that belong to a wallet. Do not manipulate this list directly, but do all operations through the WalletManager. */
  accounts: Account[];

  /** This is the encrypted cipher of the mnemonic. */
  mnemonic: string;

  /** This is the encrypted cipher of the personal extension words (passphrase). */
  extensionWords: string;

  biometrics: boolean;

  // activeAccountIndex: number;
  // activeAccountId: string;
}

interface Persisted {
  // wallets: Map<string, Wallet>
  wallets: Wallet[];

  /** This is used to select the active wallet on extension startup. */
  // activeWalletId: string | undefined | null;

  /** This is used to select the active wallet on extension startup. */
  previousWalletId: string | undefined | null;

  // autoTimeout: number
  // settings: Settings
  // wallets: Wallet[],
  // activeWalletIndex: number;
  // activeAccountIndex: number
}

interface AddressWatchState {
  address: string;

  accountId: string;

  // index: number;

  count: number;
}

interface AppState {
  /** This is used to select the active wallet on extension startup. */
  previousWalletId: string | undefined | null;
  previousAccountId: string | undefined | null;
}

interface Settings {
  developer: boolean;
  indexer: string;
  server: string;
  dataVault: string;
  autoTimeout: number;
  theme: string;
  themeColor: string;
  language: string;
  dir: string;
  requirePassword: boolean;
  /** Allows users to change how the amounts are displayed. */
  amountFormat: string;
}

interface Action {
  // args?: string[] | PermissionArguments | any;
  id: string;
  app: string;
  params: any[];
  action: string;

  content: string;
  // document?: string;
  tabId?: string;
  // level?: number;
  // condition?: string

  /** Indicates if the current dapp domain is allowed or not. */
  verify?: boolean | undefined;
}

// interface PermissionArguments {
//   host: string;
//   level: number;
//   condition: string;
// }

interface PermissionExecution {
  key: string;
  executions: number;
}

interface PermissionDomain {
  app: string;
  permissions: any;
}

interface Permission {
  action: string;
  app: string;
  type: string;
  created: number;
  walletId: string;
  accountId: string;
  keyId: string;
  key: string;
}

interface State {
  action?: Action;
  persisted: Persisted;
  store: Store;
  unlocked: string[];
}

interface StateEntry {
  activeNetworks: { networkType: string; domain: string; url: string }[];
}

interface Store {
  identities: Identity[]; // Contains the users own identities and queries/cached identities.
  cache: {
    identities: Identity[];
  };
  // TODO: Move transaction history to store, which is easier migrated to IndexedDB later on.
  // transactions: Transaction[]
}

interface Identity {
  id: string;
  published: boolean;
  sequence: number;
  services: ServiceEndpoint[];
  didDocument?: DIDDocument;
  didResolution?: DIDResolutionResult;
  didPayload?: DIDPayload;
}

interface Vault {
  id: string;
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
  };

  payload: DIDDocument;

  /** The isolated signature from the JWS. */
  signature: string;
}

interface DIDResolutionMetadataEx extends DIDResolutionMetadata {
  header: any;
  signature: string;
  data: string;
  sequence: number; // This is important to have latest of or updates to DID Documents will fail, ordered sequence is required.
}

interface DIDResolutionResult {
  didDocument: any | DIDDocument;
  didDocumentMetadata: DIDDocumentMetadata;
  didResolutionMetadata: DIDResolutionMetadataEx;
}

interface ActionUrlParameters {
  id: string;
  app: string;
  action: string;

  /** This is the content prepared by the action handler to be displayed for the user. */
  content: string;

  /** The original parameters, can be used by the action UI to display structured content. */
  params: string;

  pay?: string;

  /** Indicates if the current dapp domain is allowed or not. */
  verify?: string | undefined;
}

export interface Token {
  name: string;
  symbol: string;
  totalSupply: number;
  address: string;
  amount: number;
  decimals: number;
}

export interface AccountTokens {
  tokens: Token[];
}

interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}

interface ActionRequest {
  method: string;
  params: any[];
}

interface ActionResponse {
  /** The original request for this response. */
  request?: ActionRequest;

  /** The public key user picked for the action. */
  key?: string;

  /** The signature for the signed content in base64 encoding. */
  // signature?: string;

  /** OBSOLETE (use response instead): A copy of the actual content string that was signed. */
  // content?: object | string;

  /** The response from the action. */
  response?: object | string;

  error?: unknown | any | { message?: string; stack?: any };

  /** The unique identifier of the network user selected. */
  network?: string;

  /** The wallet identifier. */
  walletId?: string;

  /** The account identifier. */
  accountId?: string;

  /** Notification to display in the DOM upon key usage. */
  notification?: string;
}

interface ActionPrepareResult {
  /** The prepared result from the handler, this can be used in the UI. */
  content: object | string;

  /** Indicates if this handler requires the user consent to execute. */
  consent: boolean;
}

interface AccountFilter {
  /** The types of accounts to display. */
  types?: string[];

  /** The symbol of accounts to display. */
  symbol?: string[];
}

interface DIDRequestOptions {
  /** a challenge to prove DID control */
  challenge: String;

  /** a list of accepted DID methods */
  methods?: String[];

  /** client's reason for requesting a DID. Will be displayed to wallet controller */
  reason?: String;
};

interface DIDRequestResponse {
  /** the wallet owner's selected DID */
  did: String;

  /** proof of control for selected DID */
  proof: String;
};

interface VCRequestResponse {
  /** the wallet owner's selected DID */
  did: String;

  /** The verifiable credential */
  vc: String;
};

interface ActionMessage {
  /** The type of action, this is currently limited to `request` */
  type: string;

  /** Data sent from web app. */
  request: ActionRequest;

  /** The response returned from action handler. */
  response?: ActionResponse;

  target: string;
  source: string;
  ext: string;
  id: string;
  permission?: string;
  app?: string;
  walletId?: string;
  accountId?: string;
  prompt?: boolean;

  /** The internal key ID used to persist permission. */
  keyId?: string;

  /** The public key used to identity the signature returned. */
  key?: string;

  /** Indicates if the current dapp domain is allowed or not. */
  verify?: boolean | undefined;
}

interface Message {
  /** Randomly generated unique identifier of the message. */
  id?: string;

  /** Name of the extension. */
  ext?: string;

  /** The type of message is used to differentiate between action handlers. */
  type: string;

  /** Any data that is sent with this message. */
  data?: any;

  /** Use this to specify where the message should be processed. */
  target: string;

  /** Use this to tag where the message is from. */
  source: string;
}

interface MessageResponse {
  /** Same ID as the original message that this is a response to. */
  id?: string;

  /** Name of the extension. */
  ext?: string;

  /** The type of message is used to differentiate between action handlers. */
  type: string;

  /** Any data that is sent with this message. */
  data?: any;

  /** Response from the request. */
  response?: any;
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

enum Actions {
  'publicKey',
  'identity',
  'sign',
  'encrypt',
  'decrypt',
}

type Listener = (...args: any[]) => void;

interface IEvents {
  [event: string]: Listener[];
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
  TransactionHistory,
  NetworkStatus,
  IndexerApiStatus,
  LogLevel,
  IEnvironment,
  Message,
  MessageResponse,
  AddressState,
  AppState,
  AccountHistory,
  AccountUnspentTransactionOutput,
  AddressWatchState,
  AddressIndexedState,
  NetworkStatusEntry,
  // PermissionArguments,
  ActionUrlParameters,
  ActionPrepareResult,
  Permission,
  PermissionDomain,
  RequestArguments,
  ActionRequest,
  ActionResponse,
  ActionMessage,
  Contact,
  ContactAddress,
  ClientData,
  DecodedAttestion,
  Credential,
  User,
  Listener,
  IEvents,
  Actions,
  StateEntry,
  TransactionMetadata,
  TransactionMetadataEntry,
  CoinSelectionResult,
  CoinSelectionInput,
  CoinSelectionOutput,
  DIDRequestOptions,
  DIDRequestResponse,
  AccountFilter,
  VCRequestResponse,
  PermissionExecution
};
