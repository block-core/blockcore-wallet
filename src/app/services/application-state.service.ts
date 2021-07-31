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
        accounts: [

        ],
        activeAccountIndex: 0
    };

    get hasAccounts(): boolean {
        return this.persisted.accounts.length > 0;
    }

    get activeAccount() {
        if (this.persisted.activeAccountIndex > -1) {
            return this.persisted.accounts[this.persisted.activeAccountIndex];
        } else {
            return null;
        }
    }

    title!: string;

    initialized = false;

    loading = true;

    unlocked = false;

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
                // Pass the data retrieved from storage down the promise chain.
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
