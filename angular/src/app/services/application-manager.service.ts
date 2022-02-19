// import { Injectable } from '@angular/core';
// import { Network } from '../../background/networks';
// import { Action, Persisted, Store, Wallet } from '../interfaces';
// import { AUTO_TIMEOUT, INDEXER_URL, VAULT_URL } from '../shared/constants';

// @Injectable({
//     providedIn: 'root'
// })
// export class ApplicationManagerService {

//     networks: Network[] = [];

//     persisted: Persisted = {
//         settings: {
//             autoTimeout: AUTO_TIMEOUT,
//             indexer: INDEXER_URL,
//             dataVault: VAULT_URL,
//             theme: 'dark',
//             themeColor: 'primary',
//             language: 'en',
//             amountFormat: 'bitcoin',
//             developer: false
//         },
//         wallets: [] as Wallet[],
//         activeWalletId: null
//     };

//     store: Store = {
//         identities: [],
//         cache: {
//             identities: []
//         }
//     };

//     ui: any;

//     background: any;

//     initialized = false;

//     loading = true;

//     // passwords = new Map<string, string>();

//     // /** Returns list of wallet IDs that is currently unlocked. */
//     // get unlocked(): string[] {
//     //     return Array.from(this.passwords.keys());
//     // };

//     action!: Action;

//     constructor() {

//     }

//     /** Initializes the app, loading state and other operations. */
//     async initialize() {
//         this.loading = true;

//         await this.loadState();

//         this.loading = false;
//         this.initialized = true;
//     }

//     loadState = async () => {
//         // CLEAR DATA FOR DEBUG PURPOSES:
//         // chrome.storage.local.set({ 'data': null }, () => {
//         // });

//         let { data, ui, action, store } = await this.load();

//         // Only set if data is available, will use default if not.
//         if (data) {
//             this.persisted = data;
//         }

//         if (store) {
//             this.store = store;
//         }

//         this.initialized = true;
//         this.ui = ui ?? {};

//         if (action) {
//             this.action = action;
//         }

//         console.log('Load State Completed!');
//         console.log(this);
//     };

//     async save(): Promise<void> {
//         // Immediately return a promise and start asynchronous work
//         return new Promise((resolve, reject) => {
//             // Asynchronously fetch all data from storage.sync.
//             console.log('SAVING PROMISE:');
//             console.log(JSON.stringify(this.persisted));

//             // this.persisted.wallets = Object.fromEntries(this.persisted.wallets);

//             chrome.storage.local.set({ 'data': this.persisted }, () => {
//                 console.log('SAVED!');

//                 // Update the timer, the timeout might have changed.
//                 // TODO: Figure out if we need this, cause other actions will reset the timer anyway.
//                 // this.resetTimer();
//                 // this.active

//                 // Pass any observed errors down the promise chain.
//                 if (chrome.runtime.lastError) {
//                     return reject(chrome.runtime.lastError);
//                 }
//                 // Pass the data retrieved from storage down the promise chain.
//                 resolve();
//             });
//         });
//     }

//     /** Loads all the persisted state into the extension. This might become bloated on large wallets. */
//     async load(): Promise<{ data: Persisted, ui: any, action: Action, store: Store }> {
//         // Immediately return a promise and start asynchronous work
//         return new Promise((resolve, reject) => {
//             // Asynchronously fetch all data from storage.sync.

//             // data = AppState.
//             // ui = Some UI state.
//             // action = Action triggered by web apps.
//             // store = local copy of blockchain and other cloud data.

//             chrome.storage.local.get(['data', 'ui', 'action', 'store'], (items: any) => {
//                 // Pass any observed errors down the promise chain.
//                 if (chrome.runtime.lastError) {
//                     return reject(chrome.runtime.lastError);
//                 }

//                 // debugger;
//                 // items.data.wallets = new Map(Object.entries(items.data.wallets));

//                 // resolve(null);

//                 // if (items.data.wallets?.length > 0) {
//                 //     items.data.wallets[0].accounts = [];
//                 // }

//                 // // Pass the data retrieved from storage down the promise chain.
//                 resolve(items);
//             });
//         });
//     }

//     async saveAction(): Promise<void> {
//         return new Promise((resolve, reject) => {
//             chrome.storage.local.set({ 'action': this.action }, () => {
//                 console.log('SAVED ACTION!');

//                 if (chrome.runtime.lastError) {
//                     return reject(chrome.runtime.lastError);
//                 }

//                 resolve();
//             });
//         });
//     }

//     async saveStore(store: Store): Promise<void> {
//         // Immediately return a promise and start asynchronous work
//         return new Promise((resolve, reject) => {
//             // Asynchronously fetch all data from storage.sync.
//             console.log('SAVING STORE:');
//             console.log(JSON.stringify(store));

//             // this.persisted.wallets = Object.fromEntries(this.persisted.wallets);

//             chrome.storage.local.set({ 'store': store }, () => {
//                 console.log('SAVED STORE!');
//                 console.log(JSON.stringify(store));

//                 // Update the timer, the timeout might have changed.
//                 // TODO: Figure out if we need this, cause other actions will reset the timer anyway.
//                 // this.resetTimer();
//                 // this.active

//                 // Pass any observed errors down the promise chain.
//                 if (chrome.runtime.lastError) {
//                     return reject(chrome.runtime.lastError);
//                 }
//                 // Pass the data retrieved from storage down the promise chain.
//                 resolve();
//             });
//         });
//     }
// }
