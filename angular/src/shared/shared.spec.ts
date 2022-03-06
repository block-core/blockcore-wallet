import * as secp from "@noble/secp256k1";
import { mnemonicToSeedSync } from "bip39";
import { HDKey } from "micro-bip32";
import { CryptoUtility } from "src/app/services";
import { STRAX } from "src/app/services/networks";
import {
    AddressState, Transaction, IndexerBackgroundService,
    WalletState, LightWalletManager, Persisted, TransactionStore, StateStore
} from ".";

describe('SharedTests', () => {
    beforeEach(() => { });

    it('Validate the StateStore', async () => {
        const stateStore = new StateStore();

        const data1 = await stateStore.get('key1');
        expect(data1).toBeUndefined();

        const state: Persisted = {
            previousWalletId: '',
            wallets: JSON.parse(testWallet)
        };

        await stateStore.set('state', state);

        const retrievedState = await stateStore.get<any>('state');

        // Perform a deep scan between the instances:
        expect(state).toEqual(retrievedState);

        await stateStore.remove('state');

        const data2 = await stateStore.get('state');
        expect(data2).toBeUndefined();

    });

    it('Validate interval indexing', async () => {
        // Process Wallets
        const walletState = new WalletState();

        // This only works in extension... so fake the state:
        // const state = await walletState.load();
        const state: Persisted = {
            previousWalletId: '',
            wallets: JSON.parse(testWallet)
        };

        const transactionStore = new TransactionStore();
        await transactionStore.load();

        const lightWalletManager = new LightWalletManager(state);
        const wallets = lightWalletManager.getWallets();

        console.log('WALLETS DURING INDEXING:');
        console.log(wallets);

        // Get what addresses to watch from local storage.
        // globalThis.chrome.storage.local.get('')
        const indexer = new IndexerBackgroundService();

        // indexer.process();
    });

    it('Validate reset timer logic', () => {
        // This is what is read from storage, last "active date" stored.
        const currentDateJson = new Date(2022, 1, 20, 11, 30).toJSON();
        let currentResetDate = new Date(currentDateJson);

        // This is the current date.
        const currentDate = new Date(2022, 1, 20, 11, 31);
        // This value is read from user settings.
        const timeout = 4; // minutes
        const timeoutMs = (timeout * 60 * 1000);

        // The reset date is current date minus the timeout.
        var resetDate = new Date(currentDate.valueOf() - timeoutMs);

        // console.log('currentDate:', currentDate.toISOString());
        console.log('resetDate:', resetDate.toISOString());
        console.log('currentResetDate:', currentResetDate.toISOString());

        // The reset date (calculated) should always be older than current reset date (based upon user action)

        expect(resetDate < currentResetDate).toBeTrue();

        // User has not been active for more than 6 minutes...
        currentResetDate = new Date(2022, 1, 20, 11, 26);
        expect(resetDate > currentResetDate).toBeTrue();
        expect(resetDate < currentResetDate).toBeFalse();
    });

    it('Validate secure storage logic', () => {

        // The in-memory state and how we want it to be represented after loading.
        const state = new Map<string, string>();

        const privateKey = secp.utils.randomPrivateKey();
        state.set('12356-123', Buffer.from(privateKey).toString('base64'));

        console.log('state', state);

        // var b64: any = Buffer.from(privateKey).toString('base64');
        // var u8: any = new Uint8Array(Buffer.from(b64, 'base64'));

        // console.log('b64', b64);
        // console.log('u8', u8);

        // Simulate storing.
        const serializedState = JSON.stringify(Array.from(state.entries()));
        console.log('serializedState:', serializedState);
        const loadedState = JSON.parse(serializedState);

        // Now the seed has been turned into ArrayBuffer (which is the underlaying structure on which Uint8Array is an view into).
        console.log('loadedstate', loadedState);

        const restoredState = new Map(loadedState);

        console.log('restoredMap', restoredState);

        // restoredState.forEach((value: any, key, map) => {
        //   value.seed = new Uint8Array(Buffer.from(value.seed, 'base64'));
        // });

        console.log('restoredState', restoredState);
    });

    it('Load xpub and query the indexer APIs', async () => {
        const network = new STRAX();
        const indexer = new IndexerBackgroundService();

        const addressState: AddressState = {
            address: 'XEgeAGBEdKXcdKD2HYovtyp5brE5WyAKwv', // Random address from rich list
            offset: 0,
            transactions: []
        };

        // 'XWaKvgJ1HpCA8nKnqQcGESmDdMXFjmUVbH' // Random address with 7 transactions.
        // 'XEgeAGBEdKXcdKD2HYovtyp5brE5WyAKwv' // Random address with a good amount of transactions.

        const indexerUrl = 'https://{id}.indexer.blockcore.net'.replace('{id}', network.id.toLowerCase());
        const transactions = new Map<string, Transaction>();

        await indexer.processAddress(indexerUrl, addressState, transactions);

        // transaction.finalized = (transaction.confirmations > this.finalized);

        expect(addressState.transactions.length).toBeGreaterThanOrEqual(69);
        expect(addressState.offset).toBeGreaterThanOrEqual(60);

        // Second run should only query from finalized offset and only get info, not get hex again.
        await indexer.processAddress(indexerUrl, addressState, transactions);

        console.log('Transactions:', transactions);
        console.log('addressState:', addressState);
    });

    it('Validate xpub load and address derivation', async () => {
        // REMEMBER: This is a test wallet that you must never re-use yourself. This is for unit testing only.
        // Recovery Phrase: rescue interest concert clinic build half glow exchange oak holiday garlic scrub
        // STRAX
        const xpub = "xpub6DEJAVH2NnLS8a7TnvPLrtbigyZcV19qf4k17CADDmKnuCnyG1AvQD1uEWUzYzPTrDpiXtodYHTrhWH4ndU1nDGvYrwGp8oSNCyCsdxyjeT";
        const password = 'V1O4BIIvrmqU!23@@322687.';

        // const indexer = new IndexerBackgroundService();

        const wallet = JSON.parse(testWallet)[0];
        expect(wallet.restored).toBeTrue();

        const account = wallet.accounts[0];
        const network = new STRAX();
        expect(account.networkType).toBe(network.id);

        const crypto = new CryptoUtility();

        let unlockedMnemonic = await crypto.decryptData(wallet.mnemonic, password);

        expect(unlockedMnemonic).toBeTruthy();

        // From the secret receovery phrase, the master seed is derived.
        // Learn more about the HD keys: https://raw.githubusercontent.com/bitcoin/bips/master/bip-0032/derivation.png
        // const masterSeed = mnemonicToSeedSync(unlockedMnemonic);

        const accountNode = HDKey.fromExtendedKey(account.xpub, network.bip32);

        const addressNodeReceive = accountNode.deriveChild(0).deriveChild(0);
        const addressNodeChange = accountNode.deriveChild(1).deriveChild(0);

        const addressReceive = crypto.getAddressByNetwork(Buffer.from(addressNodeReceive.publicKey), network, account.purposeAddress);
        const addressChange = crypto.getAddressByNetwork(Buffer.from(addressNodeChange.publicKey), network, account.purposeAddress);

        expect(addressReceive).toBe('XM6QX8CFxE4ZjK5BjUXisaceTWrwHhWoq8');
        expect(addressChange).toBe('XSB5bTvf6zDjpWKRWsXt5r1mHuCWtnV65c');
    });

    const testWallet = `[
    {
        "restored": true,
        "id": "388fd31e-c57d-42f5-9e0b-43a1c97103de",
        "name": "My Wallet",
        "mnemonic": "lB+p+M8UcWePv5TJJYCi5F6RXg/g5dVcbTYpSGoO7Knj4zII1MtG1S84H7sWA4e4YAM6AjAcXbY55w+mstt5u+9VuSilw65GkpZkGXz0Y+vIhSjDAMjPqjbdNW5XLtivVwvWf0dgYdyYyGv/FzAMICFHxvllXHpzLlFscw==",
        "activeAccountId": "04de8ec6-6cf3-4aeb-ae3c-d13ff3d0c8d6",
        "accounts": [
            {
                "identifier": "c0ea1e83-118f-477c-aee0-922bba0ac5fb",
                "networkType": "STRAX",
                "index": 0,
                "name": "Stratis",
                "type": "coin",
                "network": 105105,
                "purpose": 44,
                "purposeAddress": 44,
                "icon": "paid",
                "state": {
                    "balance": 0,
                    "retrieved": null,
                    "receive": [
                        {
                            "index": 0,
                            "address": "XM6QX8CFxE4ZjK5BjUXisaceTWrwHhWoq8",
                            "transactions": [],
                            "retrieved": "2022-02-28T20:20:57.480Z",
                            "unspent": []
                        }
                    ],
                    "change": [
                        {
                            "index": 0,
                            "address": "XSB5bTvf6zDjpWKRWsXt5r1mHuCWtnV65c"
                        }
                    ]
                },
                "xpub": "xpub6DEJAVH2NnLS8a7TnvPLrtbigyZcV19qf4k17CADDmKnuCnyG1AvQD1uEWUzYzPTrDpiXtodYHTrhWH4ndU1nDGvYrwGp8oSNCyCsdxyjeT",
                "selected": false
            },
            {
                "identifier": "22963e7e-34b0-4c70-ab73-2abf0795494a",
                "networkType": "CRS",
                "index": 0,
                "name": "Cirrus",
                "type": "coin",
                "network": 401,
                "purpose": 44,
                "purposeAddress": 44,
                "icon": "paid",
                "state": {
                    "balance": 0,
                    "retrieved": null,
                    "receive": [
                        {
                            "index": 0,
                            "address": "CLhUvcRkRdatEiPUQo6hDxnD2boa5uEB4D",
                            "transactions": [],
                            "retrieved": "2022-02-28T20:20:57.495Z",
                            "unspent": []
                        }
                    ],
                    "change": [
                        {
                            "index": 0,
                            "address": "CSe9s9SaZmWmhqJeFD5bzFW9LxMeNp9daM"
                        }
                    ]
                },
                "xpub": "xpub6CYV24sHdhtk9vDGuDAeDrNUxZGiJx934XmfedhGnpdFbyxD7QZRqXLJdXxKxVxu5tBgoPVbCkc7Rh6eou79sZbU8XVkQLeh4iTEDLYotYg",
                "selected": false
            },
            {
                "identifier": "82b1b9a9-2207-4cdb-80f3-694c1320ce80",
                "index": 0,
                "networkType": "TSTRAX",
                "name": "StratisTest",
                "type": "coin",
                "network": 1,
                "purpose": 44,
                "purposeAddress": 44,
                "icon": "account_circle",
                "state": {
                    "balance": 0,
                    "retrieved": null,
                    "receive": [
                        {
                            "index": 0,
                            "address": "qUsiVmEX7JoiuQm5WANoQ4QVrizMHZpiq9",
                            "transactions": [],
                            "retrieved": "2022-02-28T20:20:57.510Z",
                            "unspent": []
                        }
                    ],
                    "change": [
                        {
                            "index": 0,
                            "address": "qdbtSdsrwtiM9mxcYfukA1Kqu5YgoFX1vf"
                        }
                    ]
                },
                "xpub": "xpub6CwtgLXT2q9RPNbeKfGHteY7jFWv1mnUjZsd8V25ieZoZP4iNhvswGHbxRsVbCiLzrULvRi6Nmuh1p2RqmKDpeyUBggwtgzeVkmK9rdeV8u",
                "selected": false
            },
            {
                "identifier": "04de8ec6-6cf3-4aeb-ae3c-d13ff3d0c8d6",
                "index": 0,
                "networkType": "TCRS",
                "name": "CirrusTest",
                "type": "coin",
                "network": 400,
                "purpose": 44,
                "purposeAddress": 44,
                "icon": "account_circle",
                "state": {
                    "balance": 0,
                    "retrieved": null,
                    "receive": [
                        {
                            "index": 0,
                            "address": "tShP3s9ZTZQ8EuhySGXUfa8KeiYMh7jGuu"
                        }
                    ],
                    "change": [
                        {
                            "index": 0,
                            "address": "t8YUkgyCSTznAHhSsmMT9VeaeNwrwgo6Ys"
                        }
                    ]
                },
                "xpub": "xpub6CNbYrj4hwqZvRNSdarG2WajgpLsSELPFZs15mnAwRsqDukZjCg9XzxjR6Wy2kvXAQL5TR8wNS1x91h5GeiJEjjZuRYsc9MjNhiwic6ae1q",
                "selected": false
            }
        ]
    }
]`;

});