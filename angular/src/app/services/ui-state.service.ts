import { Injectable, NgZone } from '@angular/core';
import { Action, AppState, Persisted, Store, Wallet } from '../../shared/interfaces';
import { Router } from '@angular/router';
import { CommunicationService } from './communication.service';
import { ReplaySubject, Subject } from 'rxjs';
import { Network } from '../../shared/networks';
import { SecureStateService } from './secure-state.service';
import { UIStore } from 'src/shared';

declare const VERSION: string;

@Injectable({
    providedIn: 'root'
})
export class UIState {
    constructor(
        private communication: CommunicationService,
        private router: Router,
        private secure: SecureStateService,
        private store: UIStore,
        private ngZone: NgZone) {
        console.log('Version: ' + VERSION);

    }

    async save() {
        return this.store.save();
    }

    manifest!: chrome.runtime.Manifest;

    persisted$: Subject<Persisted> = new ReplaySubject();

    networks: Network[] = [];

    get persisted(): AppState {
        return this.store.get();
    }

    // persisted: Persisted = {
    //     wallets: [] as Wallet[],
    //     previousWalletId: null
    // };

    // store: Store = {
    //     identities: [],
    //     cache: {
    //         identities: []
    //     }
    // };

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

    timer: any;

    port!: chrome.runtime.Port | null;

    background: any;
}
