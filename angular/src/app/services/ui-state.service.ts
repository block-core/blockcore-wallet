import { Injectable } from '@angular/core';
import { Action, AppState, Persisted } from '../../shared/interfaces';
import { ReplaySubject, Subject } from 'rxjs';
import { Network } from '../../shared/networks';
import { UIStore } from 'src/shared';

@Injectable({
    providedIn: 'root'
})
export class UIState {
    constructor(
        private store: UIStore) {
        
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
