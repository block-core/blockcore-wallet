import { Injectable, NgZone } from '@angular/core';
import { Action, Persisted, Store, Wallet } from '../interfaces';
import { Router } from '@angular/router';
import { CommunicationService } from './communication.service';
import { ReplaySubject, Subject } from 'rxjs';
import { Network } from './networks';
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

    manifest!: chrome.runtime.Manifest;

    persisted$: Subject<Persisted> = new ReplaySubject();

    networks: Network[] = [];

    persisted: Persisted = {
        wallets: [] as Wallet[],
        previousWalletId: null
    };

    store: Store = {
        identities: [],
        cache: {
            identities: []
        }
    };

    showBackButton = false;

    goBackHome = true;

    backUrl: string;

    params: any;

    action?: Action;

    title!: string;

    /** Indicates that the UIState has been initilized. */
    initialized = false;

    /** Indicates that the extension is currently loading. This is not just for UIState, but for the whole app. */
    loading = true;

    // get unlocked() {
    //     return this.secure.unlockedWalletsSubject.value;
    // }

    timer: any;

    port!: chrome.runtime.Port | null;

    background: any;

    async wipe(): Promise<void> {
        await chrome.storage.local.clear();
        await (<any>chrome.storage).session.clear();
    }

    async save(): Promise<void> {
        return chrome.storage.local.set({ 'data': this.persisted });
    }

    /** Loads all the persisted state into the extension. This might become bloated on large wallets. */
    async load() {
        const { data, ui, action, store } = await chrome.storage.local.get(['data', 'ui', 'action', 'store']);

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
