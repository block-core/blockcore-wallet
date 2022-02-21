import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, ReplaySubject, Subject } from "rxjs";
import { MINUTE } from "../shared/constants";
import { SettingsService } from "./settings.service";

// interface SecureState {
//     wallets: Map<string, { password: string, seed: Uint8Array }>;
//     secrets: Map<string, { key: string, value: any }>;
// }

interface SecureValues {

}


@Injectable({
    providedIn: 'root'
})
export class SecureStateService {
    private timer: any;

    /** Contains the password and seed (unlocked) of wallets. This object should never be persisted and only exists in memory. */
    // walletSecrets = new Map<string, { password: string, seed: Uint8Array }>();
    // private secrets = new Map<string, { key: string, value: any }>();
    //private state: SecureState;
    private state: Map<string, { key: string, value: any }>;

    constructor(
        // This should be done outside of the service.
        private settings: SettingsService
    ) {
        // this.state = { wallets: new Map<string, { password: string, seed: Uint8Array }>(), secrets: new Map<string, { key: string, value: any }>() };
        // this.resetTimer();

        const storage = globalThis.chrome.storage as any;

        // Each instance of extension need this listener when session is cleared.
        storage.session.onChanged.addListener((changes: any, namespace: any) => {
            console.log("storage.session.onChanged:");
            console.log(changes);
            console.log(namespace);

            // this.uiState.activeWalletSubject.next(this.uiState.activeWallet);

            // Every time there is a change, retrieve the latest and trigger the subject.
            this.load();
        });
    }

    unlockedWalletsSubject: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

    public get unlockedWallets$(): Observable<string[]> {
        return this.unlockedWalletsSubject.asObservable();
    }

    remove(key: string) {

    }

    update(key: string, password: string, seed: Uint8Array) {

    }

    async load() {
        if (globalThis.chrome && globalThis.chrome.storage) {
            const storage = globalThis.chrome.storage as any;

            // const existingState = await storage.session.get(['values']) as SecureState;
            let { values } = await storage.session.get(['values']);

            console.log('EXISTING STATE', values);

            if (!values) {
                // return [];
            } else {
                // We must parse the Array to UInut8Array

                // values.

                // Uint8Array

            }

            // const dataString = JSON.stringify(Array.from(new Uint8Array(arrayBuffer)));
            // Array.from(new Uint8Array(arrayBuffer))

            // if (values) {
            //     this.state = new Map(values);
            //     // values = { secrets: new Map<string, { key: string, value: any }>(), wallets: new Map<string, { password: string, seed: Uint8Array }>() }
            // } else {
            //     this.state = new Map<string, { key: string, value: any }>();
            //     // Must transform the 
            // }

            // this.state = values;

            // Restart the timer on load
            // this.resetTimer();
        }
    }


    /** Clears the current secure state. */
    async clear() {
        if (globalThis.chrome && globalThis.chrome.storage) {
            const storage = globalThis.chrome.storage as any;

            // // Clear the in-memory copy
            // this.state.clear();

            // // Clear the session storage copy.
            // storage.session.clear();
        }
    }

    async load2() {
        if (globalThis.chrome && globalThis.chrome.storage) {
            const storage = globalThis.chrome.storage as any;

            // const existingState = await storage.session.get(['values']) as SecureState;
            let { values } = await storage.session.get(['values']);

            console.log('EXISTING STATE', values);

            // const dataString = JSON.stringify(Array.from(new Uint8Array(arrayBuffer)));
            // Array.from(new Uint8Array(arrayBuffer))

            if (values) {
                this.state = new Map(values);
                // values = { secrets: new Map<string, { key: string, value: any }>(), wallets: new Map<string, { password: string, seed: Uint8Array }>() }
            } else {
                this.state = new Map<string, { key: string, value: any }>();
                // Must transform the 
            }

            // this.state = values;

            // Restart the timer on load
            // this.resetTimer();
        }
    }

    async save() {
        if (globalThis.chrome && globalThis.chrome.storage) {
            const storage = globalThis.chrome.storage as any;

            // Serialize the map:
            const state = Array.from(this.state.entries());
            //JSON.stringify(Array.from(map.entries()));

            console.log('STATE ON SAVE:', state);
            storage.session.set({ 'values': state });

            // Restart the timer on save
            // this.resetTimer();
        }
    }

    get(key: string) {
        return this.state.get(key);
    }

    async set(key: string, value: any) {
        this.state.set(key, value);
        await this.save();
    }

    private async saveItem(key: string, value: any) {
        if (globalThis.chrome && globalThis.chrome.storage) {
            const storage = globalThis.chrome.storage as any;

            // Serialize the map:
            const state = Array.from(this.state.entries());
            //JSON.stringify(Array.from(map.entries()));

            console.log('STATE ON SAVE:', state);
            storage.session.set({ key: state });

            // Restart the timer on save
            // this.resetTimer();
        }
    }

    // async resetTimer() {
    //     const result = await chrome.storage.local.get(['active']);
    //     const currentResetDate = new Date(result['active']);

    //     // if (currentResetDate)
    //     // const resetDate = new Date();
    //     // const currentTime = resetDate.toJSON();
    //     // await chrome.storage.local.set({ 'active': currentTime });
    //     // globalThis.chrome.storage.local.set({ 'active': resetDate });

    //     // if (this.timer) {
    //     //     console.log('CLEARING EXISTING TIMEOUT!');
    //     //     clearTimeout(this.timer);
    //     // }

    //     // // We will only set timer if the wallet is actually unlocked.
    //     // if (this.state?.size > 0) {

    //     //     console.log('SETTING TIMEOUT...');

    //     //     this.timer = setTimeout(
    //     //         async () => {
    //     //             console.log('TIMEOUT REACHED, CLEARING SECURE STATE!!');
    //     //             await this.clear();
    //     //         },
    //     //         10000
    //     //         //this.settings.values.autoTimeout * MINUTE
    //     //     );
    //     // } else {
    //     //     console.log('THERE ARE ZERO ITEMS!');
    //     // }
    // }
}