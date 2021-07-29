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
        accounts: []
    };

    get hasAccounts(): boolean {
        return this.persisted.accounts.length > 0;
    }

    mnemonic: undefined | string;

    initialized = false;

    save(cb: any) {
        chrome.storage.local.set({ 'data': this.persisted }, () => {
            if (cb) {
                cb();
            }

        });
    }

    load(cb: any) {
        chrome.storage.local.get(['data'], (result) => {

            if (result.data) {
                this.persisted = result.data;
            }

            // console.log('State loaded: ');
            // console.log(JSON.stringify(this.persisted));
            // console.log(JSON.stringify(result));

            this.initialized = true;

            if (cb) {
                cb();
            }
        });
    }
}
