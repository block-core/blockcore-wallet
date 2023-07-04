import { openDB, deleteDB, wrap, unwrap, IDBPDatabase, DBSchema } from 'idb';

/** Make sure you read and learn: https://github.com/jakearchibald/idb */

export function now() {
    return Math.floor(Date.now() / 1000);
}

interface WalletDB extends DBSchema {
    state: {
        value: any;
        key: number;
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
}

interface TableAccountState {
}

interface TableAccountHistory {

}

interface TableSettings {

}

interface TableNetworkState {

}

interface TableApp {

}

interface TableAccount {

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

interface TableWallet {
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
        this.db = await openDB<WalletDB>(this.name, 1, {
            upgrade(db, oldVersion, newVersion, transaction, event) {
                debugger;

                switch (oldVersion) {
                    case 0:
                        upgradeV0toV1();
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
                    db.createObjectStore('state', { keyPath: 'url' });
                    db.createObjectStore('accountstate', { keyPath: 'id' });
                    db.createObjectStore('accounthistory', { keyPath: 'id', autoIncrement: true });
                    db.createObjectStore('settings', { keyPath: 'id' });
                    db.createObjectStore('networkstate', { keyPath: 'pubkey' });
                    db.createObjectStore('app', { keyPath: 'id' });
                    db.createObjectStore('wallet', { keyPath: 'id' });
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
            },
            blocking(currentVersion, blockedVersion, event) {
                // …
            },
            terminated() {
                // …
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

    async delete() {
        await deleteDB(this.name, {
            blocked() {
                console.log('BLOCKED...');
            },
        });
    }
}