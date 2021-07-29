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
        'mnemonic': ''
    };

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

            if (result) {
                this.persisted = result.data;
            }

            this.initialized = true;

            if (cb) {
                cb();
            }
        });
    }
}
