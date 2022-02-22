// import { Injectable } from "@angular/core";
// import { Action, Persisted, Store, Settings, Wallet } from "../app/interfaces";
// import { AUTO_TIMEOUT, INDEXER_URL, MINUTE, VAULT_URL } from "../app/shared/constants";
// import { Network } from "./networks";

// @Injectable({
//     providedIn: 'root'
// })
// export class AppState {

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

//     // get hasWallets(): boolean {
//     //     return this.persisted.wallets.length > 0;
//     // }

//     // get activeWallet() {
//     //     if (this.persisted.activeWalletId) {
//     //         return this.persisted.wallets.find(w => w.id == this.persisted.activeWalletId);
//     //         // return this.persisted.wallets.get(this.persisted.activeWalletId);
//     //         // return this.persisted.wallets[this.persisted.activeWalletIndex];
//     //     } else {
//     //         return undefined;
//     //     }
//     // }

//     // get hasAccounts(): boolean {
//     //     if (!this.activeWallet) {
//     //         return false;
//     //     }

//     //     return this.activeWallet.accounts?.length > 0;
//     // }

//     // get activeAccount() {
//     //     if (!this.activeWallet) {
//     //         return null;
//     //     }

//     //     const activeWallet = this.activeWallet;

//     //     if (!activeWallet.accounts) {
//     //         return null;
//     //     }

//     //     if (activeWallet.activeAccountIndex == null || activeWallet.activeAccountIndex == -1) {
//     //         activeWallet.activeAccountIndex = 0;
//     //     }
//     //     // If the active index is higher than available accounts, reset to zero.
//     //     else if (activeWallet.activeAccountIndex >= activeWallet.accounts.length) {
//     //         activeWallet.activeAccountIndex = 0;
//     //     }

//     //     return this.activeWallet.accounts[activeWallet.activeAccountIndex];
//     // }

//     async save(): Promise<void> {
//         return chrome.storage.local.set({ 'data': this.persisted });
//     }

//     /** Loads all the persisted state into the extension. This might become bloated on large wallets. */
//     async load() {
//         const { data, ui, action, store } = await chrome.storage.local.get(['data', 'ui', 'action', 'store']);

//         debugger;

//         // Only set if data is available, will use default if not.
//         if (data) {
//             this.persisted = data;
//         }

//         console.log('DATA', data);
//         console.log('PERSISTED', this.persisted);

//         if (store) {
//             this.store = store;
//         }

//         this.ui = ui ?? {};

//         if (action) {
//             this.action = action;
//         }

//         this.initialized = true;
//     }

//     async saveAction(): Promise<void> {
//         return chrome.storage.local.set({ 'action': this.action });
//     }

//     async saveStore(store: Store): Promise<void> {
//         return chrome.storage.local.set({ 'store': store });
//     }
// }