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

        if ((<any>navigator).standalone === undefined) {
            // App is not running on iOS/iPadOS.
            this.iOS = false;
        } else if ((<any>navigator).standalone === false) {
            // user opened the PWA in the browser and is using it there.
            this.standalone = false;
        } else if ((<any>navigator).standalone === true) {
            // user opened the PWA from the home screen and is getting the standalone PWA experience.
            this.standalone = true;
        }

        // This will keep a copy of the install promt so we can trigger it manually.
        globalThis.addEventListener('beforeinstallprompt', (e) => {
            this.deferredInstallPrompt = e;
        });

        globalThis.addEventListener('appinstalled', () => {
            // If visible, hide the install promotion
            this.showInstallButton = false;
            console.log('INSTALL: Success');
        });
    }

    async save() {
        return this.store.save();
    }

    async install() {
        if (this.deferredInstallPrompt !== null) {

            this.deferredInstallPrompt.prompt();
            const { outcome } = await this.deferredInstallPrompt.userChoice;

            if (outcome === 'accepted') {
                this.deferredInstallPrompt = null;
            }
        }
    }

    manifest!: chrome.runtime.Manifest;

    persisted$: Subject<Persisted> = new ReplaySubject();

    networks: Network[] = [];

    get persisted(): AppState {
        return this.store.get();
    }

    showInstallButton = true;

    deferredInstallPrompt: any;

    iOS = true;

    standalone = false;

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
