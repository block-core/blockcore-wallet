import { openDB, deleteDB, wrap, unwrap, IDBPDatabase, DBSchema } from 'idb';
import { AccountUnspentTransactionOutput, Action, Persisted, Store, TransactionHistory } from '../interfaces';

/** Make sure you read and learn: https://github.com/jakearchibald/idb */

export function now() {
    return Math.floor(Date.now() / 1000);
}

interface WalletDB extends DBSchema {
    state: {
        value: any;
        key: number;
    };

    account: {
        value: any;
        key: string;
    };

    accountstate: {
        value: TableAccountState;
        key: string;
    };

    accounthistory: {
        value: TableAccountHistory;
        key: string;
    };

    settings: {
        value: TableSettings;
        key: string;
    };

    networkstate: {
        value: TableNetworkState;
        key: string;
    };

    app: {
        value: TableApp;
        key: string;
    };

    wallet: {
        value: TableWallet;
        key: string;
    };

    bucket: {
        value: any;
        key: string;
    };
}

export interface TableState {
    action?: Action;
    persisted: Persisted;
    store: Store;
    unlocked: string[];
}

export interface TableAccount {

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

    color?: string;

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

export interface TableAccountState {
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
    //   receive: Address[];

    //   /** All the known used and one unused change address. */
    //   change: Address[];

    /** The last date in ISO format the account was scanned for changes. */
    lastScan?: string;

    /** Indicates if the scan has been completed. */
    completedScan?: boolean;
}

export interface TableAccountHistory {
    balance: number;
    unconfirmed: number;
    history: TransactionHistory[];
    unspent: AccountUnspentTransactionOutput[];

}



export interface TableSettings {
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

export interface TableNetworkState {

}

export interface TableApp {

}


export interface TableWallet {
    /** Indicates if this wallet was restored or created as new. If the wallet is restored, we will automatically scan the blockchains to data when new accounts are added. */
    restored: boolean;
    id: string;
    name: string;
    // network: string;

    /** Accounts that belong to a wallet. Do not manipulate this list directly, but do all operations through the WalletManager. */
    accounts: TableAccount[];

    /** This is the encrypted cipher of the mnemonic. */
    mnemonic: string;

    /** This is the encrypted cipher of the personal extension words (passphrase). */
    extensionWords: string;

    biometrics: boolean;

    // activeAccountIndex: number;
    // activeAccountId: string;
}

export class Storage {
    public db!: IDBPDatabase<WalletDB>;

    constructor(private name: string) { }

    async open() {
        // If we already have a database connection, then return.
        if (this.db) {
            return;
        }

        this.db = await openDB<WalletDB>(this.name, 1, {
            upgrade(db, oldVersion, newVersion, transaction, event) {
                switch (oldVersion) {
                    case 0:
                        upgradeV0toV1();
                        upgradeV1toV2();
                        break;
                    /* FALLTHROUGH */
                    case 1:
                        upgradeV1toV2();
                        break;
                    case 2:
                        upgradeV1toV2();
                        break;
                    default:
                        console.error('Unknown database version.');
                }

                function upgradeV0toV1() {
                    db.createObjectStore('state', { keyPath: 'id' });
                    db.createObjectStore('account', { keyPath: 'id' });
                    db.createObjectStore('accountstate', { keyPath: 'id' });
                    db.createObjectStore('accounthistory', { keyPath: 'id', autoIncrement: true });
                    db.createObjectStore('settings', { keyPath: 'id' });
                    db.createObjectStore('networkstate', { keyPath: 'id' });
                    db.createObjectStore('app', { keyPath: 'id' });
                    db.createObjectStore('wallet', { keyPath: 'id' });
                    db.createObjectStore('bucket', { keyPath: 'id' });
                    // const notificationsStore = db.createObjectStore('notifications', { keyPath: 'id' });
                    // notificationsStore.createIndex('created', 'created');

                    // const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
                    // eventsStore.createIndex('pubkey', 'pubkey');
                    // eventsStore.createIndex('created', 'created_at');
                    // eventsStore.createIndex('kind', 'kind');

                    //const profilesStore = db.createObjectStore('profiles', { keyPath: 'pubkey' });
                    //profilesStore.createIndex('status', 'status');
                }

                function upgradeV1toV2() {
                    //    db.createObjectStore('badges', { keyPath: 'id' });
                }
            },
            blocked(currentVersion, blockedVersion, event) {
                // …
                debugger;
            },
            blocking(currentVersion, blockedVersion, event) {
                // …
                debugger;
            },
            terminated() {
                // …
                debugger;
            },
        });
    }

    close() {
        this.db.close();
    }

    async getState() {
        return this.db.get('state', 1);
    }

    async putState(value: any) {
        value.id = 1;
        value.modified = now();
        return this.db.put('state', value);
    }


    async getAccount(key: string) {
        return this.db.get('account', key);
    }

    async getAccounts() {
        return this.db.getAll('account');
    }

    async putAccount(value: TableAccount) {
        //value.saved = now();
        return this.db.put('account', value);
    }

    async deleteAccount(key: string) {
        return this.db.delete('account', key);
    }


    async getAccountState(key: string) {
        return this.db.get('accountstate', key);
    }

    async getAccountStates() {
        return this.db.getAll('accountstate');
    }

    async putAccountState(value: TableAccountState) {
        //value.saved = now();
        return this.db.put('accountstate', value);
    }

    async deleteAccountState(key: string) {
        return this.db.delete('accountstate', key);
    }

    async deleteDatabase() {
        await deleteDB(this.name, {
            blocked() {
                console.log('BLOCKED...');
            },
        });
    }


    async getAccountHistory(key: string) {
        return this.db.get('accounthistory', key);
    }

    async getAccountHistories() {
        return this.db.getAll('accounthistory');
    }

    async putAccountHistory(value: TableAccountHistory) {
        //value.saved = now();
        return this.db.put('accounthistory', value);
    }

    async deleteAccountHistory(key: string) {
        return this.db.delete('accounthistory', key);
    }


    async getSetting(key: string) {
        return this.db.get('settings', key);
    }

    async getSettings() {
        return this.db.getAll('settings');
    }

    async putSettings(value: TableSettings) {
        //value.saved = now();
        return this.db.put('settings', value);
    }

    async deleteSettings(key: string) {
        return this.db.delete('settings', key);
    }


    async getNetworkState(key: string) {
        return this.db.get('networkstate', key);
    }

    async getNetworkStates() {
        return this.db.getAll('networkstate');
    }

    async putNetworkState(value: TableNetworkState) {
        //value.saved = now();
        return this.db.put('networkstate', value);
    }

    async deleteNetworkState(key: string) {
        return this.db.delete('networkstate', key);
    }



    async getApp(key: string) {
        return this.db.get('app', key);
    }

    async getApps() {
        return this.db.getAll('app');
    }

    async putApp(value: TableApp) {
        //value.saved = now();
        return this.db.put('app', value);
    }

    async deleteApp(key: string) {
        return this.db.delete('app', key);
    }


    async getWallet(key: string) {
        return this.db.get('wallet', key);
    }

    async getWallets() {
        return this.db.getAll('wallet');
    }

    async putWallet(value: TableWallet) {
        //value.saved = now();
        return this.db.put('wallet', value);
    }

    async deleteWallet(key: string) {
        return this.db.delete('wallet', key);
    }

    async getBucket(key: string) {
        return this.get('bucket', key);
    }

    async putBucket(key: any, value: any) {
        //value.saved = now();
        return this.put('bucket', { id: key, value });
    }

    async deleteBucket(key: string) {
        return this.delete('bucket', key);
    }

    async get(table: string | any, key: string) {
        return this.db.get(table, key);
    }

    async getAll(table: string | any) {
        return this.db.getAll(table);
    }

    async put(table: string | any, value: any) {
        //value.saved = now();
        return this.db.put(table, value);
    }

    async delete(table: string | any, key: string) {
        return this.db.delete(table, key);
    }
}

export class Database {
    public static Instance = new Storage('blockcore-wallet');
}
