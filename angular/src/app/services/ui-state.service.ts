import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { Account, Action, NetworkStatus, Persisted, Store, Wallet } from '../interfaces';
import { MINUTE } from '../shared/constants';
import { Router } from '@angular/router';
import { CommunicationService } from './communication.service';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { Observable } from "rxjs";
import { Network } from 'src/background/networks';
import { SecureStateService } from './secure-state.service';

declare const VERSION: string;

@Injectable({
    providedIn: 'root'
})
export class UIState {

    constructor(
        private communication: CommunicationService,
        private router: Router,
        private secure: SecureStateService,
        private ngZone: NgZone) {
        console.log('Version: ' + VERSION);
    }

    persisted$: Subject<Persisted> = new ReplaySubject();

    persisted!: Persisted;

    manifest!: chrome.runtime.Manifest;

    store!: Store;

    showBackButton = false;

    goBackHome = true;

    backUrl: string;

    params: any;

    // networkStatus: NetworkStatus[];

    // getAllAccounts() {
    //     return this.flatDeep(this.activeWallet?.accounts);
    // }

    // flatDeep(arr, d = 1) {
    //     return d > 0 ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val), [])
    //         : arr.slice();
    // };

    // activeWalletIndex: number = 0;

    get hasWallets(): boolean {
        return this.persisted?.wallets.length > 0;
    }

    // activeWallet$: Subject<Wallet | undefined> = new ReplaySubject();
    activeWalletSubject: BehaviorSubject<Wallet | undefined> = new BehaviorSubject<Wallet | undefined>(undefined);

    public get activeWallet$(): Observable<Wallet | undefined> {
        return this.activeWalletSubject.asObservable();
    }

    get activeWallet() {
        if (this.persisted.activeWalletId) {
            return this.persisted.wallets.find(w => w.id == this.persisted.activeWalletId);
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

    activeAccountSubject: BehaviorSubject<Account | undefined> = new BehaviorSubject<Account | undefined>(undefined);

    public get activeAccount$(): Observable<Account | undefined> {
        return this.activeAccountSubject.asObservable();
    }

    get activeAccount() {
        if (!this.activeWallet) {
            return undefined;
        }

        const activeWallet = this.activeWallet;

        if (!activeWallet.accounts) {
            return undefined;
        }

        if (activeWallet.activeAccountId == null) {
            return undefined;
        }

        const accountIndex = activeWallet.accounts.findIndex(a => a.identifier == activeWallet.activeAccountId);

        return this.activeWallet.accounts[accountIndex];
    }

    action?: Action;

    title!: string;

    initialized = false;

    loading = true;

    get activeWalletUnlocked(): boolean {
        if (!this.activeWallet) {
            return false;
        }

        return this.secure.unlocked(this.activeWallet.id);
    }

    get unlocked() {
        return this.secure.unlockedWalletsSubject.value;
    }

    timer: any;

    port!: chrome.runtime.Port | null;

    active() {
        console.log('active:');
        this.resetTimer();
    }

    resetTimer() {
        this.communication.send('timer-reset');

        // console.log('resetTimer:', this.persisted.autoTimeout * MINUTE);
        // if (this.timer) {
        //     clearTimeout(this.timer);
        // }

        // // We will only set timer if the wallet is actually unlocked.
        // if (this.unlocked) {
        //     console.log('Setting timer to automatically unlock.');
        //     this.timer = setTimeout(
        //         () => this.ngZone.run(() => {
        //             this.onInactiveTimeout()
        //         }),
        //         this.persisted.autoTimeout * MINUTE
        //     );
        // } else {
        //     console.log('Timer not set since wallet is not unlocked.');
        // }
    }

    async wipe(): Promise<void> {
        await chrome.storage.local.clear();
        await (<any>chrome.storage).session.clear();
    }

    // async save(): Promise<void> {

    //     // Immediately return a promise and start asynchronous work
    //     return new Promise((resolve, reject) => {
    //         // Asynchronously fetch all data from storage.sync.

    //         console.log('SAVING PROMISE:');
    //         console.log(JSON.stringify(this.persisted));

    //         chrome.storage.local.set({ 'data': this.persisted }, () => {

    //             console.log('SAVED!');

    //             // Update the timer, the timeout might have changed.
    //             this.resetTimer();

    //             // Pass any observed errors down the promise chain.
    //             if (chrome.runtime.lastError) {
    //                 return reject(chrome.runtime.lastError);
    //             }
    //             // Pass the data retrieved from storage down the promise chain.
    //             resolve();
    //         });
    //     });

    // }

    // async load(): Promise<{ data: any, action: string }> {
    //     // Immediately return a promise and start asynchronous work
    //     return new Promise((resolve, reject) => {
    //         // Asynchronously fetch all data from storage.sync.
    //         chrome.storage.local.get(['data', 'action'], (items: any) => {
    //             // Pass any observed errors down the promise chain.
    //             if (chrome.runtime.lastError) {
    //                 return reject(chrome.runtime.lastError);
    //             }

    //             // resolve(null);

    //             // if (items.data.wallets?.length > 0) {
    //             //     items.data.wallets[0].accounts = [];
    //             // }

    //             // // Pass the data retrieved from storage down the promise chain.
    //             resolve(items);
    //         });
    //     });

    //     // chrome.storage.local.get(['data'], (result) => {

    //     //     if (result.data) {
    //     //         this.persisted = result.data;

    //     //         console.log('Persisted loaded from saved state: ', this.persisted);
    //     //     }

    //     //     // console.log('State loaded: ');
    //     //     // console.log(JSON.stringify(this.persisted));
    //     //     // console.log(JSON.stringify(result));

    //     //     this.initialized = true;

    //     //     if (cb) {
    //     //         this.loading = false;
    //     //         cb();
    //     //     }
    //     // });
    // }

    networks: Network[] = [];

    // persisted: Persisted = {
    //     settings: {
    //         autoTimeout: AUTO_TIMEOUT,
    //         indexer: INDEXER_URL,
    //         dataVault: VAULT_URL,
    //         theme: 'dark',
    //         themeColor: 'primary',
    //         language: 'en',
    //         amountFormat: 'bitcoin',
    //         developer: false
    //     },
    //     wallets: [] as Wallet[],
    //     activeWalletId: null
    // };

    // store: Store = {
    //     identities: [],
    //     cache: {
    //         identities: []
    //     }
    // };

    // ui: any;

    background: any;

    // initialized = false;

    // loading = true;

    // passwords = new Map<string, string>();

    // /** Returns list of wallet IDs that is currently unlocked. */
    // get unlocked(): string[] {
    //     return Array.from(this.passwords.keys());
    // };

    // action!: Action;

    async save(): Promise<void> {
        return chrome.storage.local.set({ 'data': this.persisted });
    }

    /** Loads all the persisted state into the extension. This might become bloated on large wallets. */
    async load() {
        const { data, ui, action, store } = await chrome.storage.local.get(['data', 'ui', 'action', 'store']);

        debugger;

        // Only set if data is available, will use default if not.
        if (data) {
            this.persisted = data;
        }

        console.log('DATA', data);
        console.log('PERSISTED', this.persisted);

        if (store) {
            this.store = store;
        }

        // this.ui = ui ?? {};

        if (action) {
            this.action = action;
        }

        this.initialized = true;
    }

    async saveAction(): Promise<void> {
        return chrome.storage.local.set({ 'action': this.action });
    }

    async saveStore(store: Store): Promise<void> {
        return chrome.storage.local.set({ 'store': store });
    }
}
