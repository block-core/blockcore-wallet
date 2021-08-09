import { Action, Persisted, Wallet } from "src/app/interfaces";
import { MINUTE } from "src/app/shared/constants";

export class AppState {

    persisted: Persisted = {
        autoTimeout: 10,
        wallets: [],
        activeWalletId: null
    };

    ui: any;

    background: any;

    initialized = false;

    loading = true;

    passwords = new Map<string, string>();

    /** Returns list of wallet IDs that is currently unlocked. */
    get unlocked(): string[] {
        return Array.from(this.passwords.keys());
    };

    action!: Action;

    get hasWallets(): boolean {
        return this.persisted.wallets.length > 0;
    }

    get activeWallet() {
        if (this.persisted.activeWalletId) {
            return this.persisted.wallets.find(w => w.id == this.persisted.activeWalletId);
            // return this.persisted.wallets.get(this.persisted.activeWalletId);
            // return this.persisted.wallets[this.persisted.activeWalletIndex];
        } else {
            return undefined;
        }
    }

    get hasAccounts(): boolean {
        if (!this.activeWallet) {
            return false;
        }

        return this.activeWallet.accounts?.length > 0;
    }

    get activeAccount() {
        if (!this.activeWallet) {
            return null;
        }

        const activeWallet = this.activeWallet;

        if (!activeWallet.accounts) {
            return null;
        }

        if (activeWallet.activeAccountIndex == null || activeWallet.activeAccountIndex == -1) {
            activeWallet.activeAccountIndex = 0;
        }
        // If the active index is higher than available accounts, reset to zero.
        else if (activeWallet.activeAccountIndex >= activeWallet.accounts.length) {
            activeWallet.activeAccountIndex = 0;
        }

        return this.activeWallet.accounts[activeWallet.activeAccountIndex];
    }

    async save(): Promise<void> {
        // Immediately return a promise and start asynchronous work
        return new Promise((resolve, reject) => {
            // Asynchronously fetch all data from storage.sync.
            console.log('SAVING PROMISE:');
            console.log(JSON.stringify(this.persisted));

            // this.persisted.wallets = Object.fromEntries(this.persisted.wallets);

            chrome.storage.local.set({ 'data': this.persisted }, () => {
                console.log('SAVED!');

                // Update the timer, the timeout might have changed.
                // TODO: Figure out if we need this, cause other actions will reset the timer anyway.
                // this.resetTimer();
                // this.active

                // Pass any observed errors down the promise chain.
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                // Pass the data retrieved from storage down the promise chain.
                resolve();
            });
        });
    }

    async load(): Promise<{ data: Persisted, ui: any, action: Action }> {
        // Immediately return a promise and start asynchronous work
        return new Promise((resolve, reject) => {
            // Asynchronously fetch all data from storage.sync.
            chrome.storage.local.get(['data', 'ui', 'action'], (items: any) => {
                // Pass any observed errors down the promise chain.
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }

                // debugger;
                // items.data.wallets = new Map(Object.entries(items.data.wallets));

                // resolve(null);

                // if (items.data.wallets?.length > 0) {
                //     items.data.wallets[0].accounts = [];
                // }

                // // Pass the data retrieved from storage down the promise chain.
                resolve(items);
            });
        });
    }

    async saveAction(): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ 'action': this.action }, () => {
                console.log('SAVED ACTION!');

                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }

                resolve();
            });
        });
    }
}