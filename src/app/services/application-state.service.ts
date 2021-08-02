import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ApplicationState {

    constructor() {
    }

    persisted: any = {
        'mnemonic': '',
        wallets: [

        ],
        activeWalletIndex: 0,
        activeAccountIndex: 0
    };

    get hasWallets(): boolean {
        return this.persisted.wallets?.length > 0;
    }

    get activeWallet() {
        if (this.persisted.activeWalletIndex > -1) {
            return this.persisted.wallets[this.persisted.activeWalletIndex];
        } else {
            return null;
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

        if (!this.activeWallet.accounts) {
            return null;
        }

        // If the index is -1, force it to pick first account.
        if (this.persisted.activeAccountIndex == null || this.persisted.activeAccountIndex == -1) {
            this.persisted.activeAccountIndex = 0;
        }

        // If the active index is higher than available accounts, reset to zero.
        if (this.persisted.activeAccountIndex >= this.activeWallet.accounts.length) {
            this.persisted.activeAccountIndex = 0;
        }

        return this.activeWallet.accounts[this.persisted.activeAccountIndex];
    }

    title!: string;

    initialized = false;

    loading = true;

    unlocked = false;

    // changeAccount(index: number) {
    //     if (index < 0) {
    //         this.persisted.activeAccountIndex = -1;
    //     }
    //     // Check if the index is available before allowing to change.
    //     if (index != -1 && index < this.appState.activeWallet.accounts.length) {
    //         this.appState.persisted.activeAccountIndex = index;
    //     }
    //     else {
    //         console.log('Attempting to show account that does not exists.');
    //         this.router.navigateByUrl('/account');
    //     }
    // }

    async save(): Promise<void> {

        // Immediately return a promise and start asynchronous work
        return new Promise((resolve, reject) => {
            // Asynchronously fetch all data from storage.sync.

            console.log('SAVING PROMISE:');
            console.log(JSON.stringify(this.persisted));

            chrome.storage.local.set({ 'data': this.persisted }, () => {

                console.log('SAVED!');

                // Pass any observed errors down the promise chain.
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                // Pass the data retrieved from storage down the promise chain.
                resolve();
            });
        });

    }

    async load() {
        // Immediately return a promise and start asynchronous work
        return new Promise((resolve, reject) => {
            // Asynchronously fetch all data from storage.sync.
            chrome.storage.local.get(['data'], (items) => {
                // Pass any observed errors down the promise chain.
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }

                // resolve(null);

                // if (items.data.wallets?.length > 0) {
                //     items.data.wallets[0].accounts = [];
                // }

                // // Pass the data retrieved from storage down the promise chain.
                resolve(items.data);
            });
        });

        // chrome.storage.local.get(['data'], (result) => {

        //     if (result.data) {
        //         this.persisted = result.data;

        //         console.log('Persisted loaded from saved state: ', this.persisted);
        //     }

        //     // console.log('State loaded: ');
        //     // console.log(JSON.stringify(this.persisted));
        //     // console.log(JSON.stringify(result));

        //     this.initialized = true;

        //     if (cb) {
        //         this.loading = false;
        //         cb();
        //     }
        // });
    }
}
