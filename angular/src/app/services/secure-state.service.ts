import { Injectable, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable } from "rxjs";
import { RuntimeService } from "../../shared/runtime.service";
import { StorageService } from "../../shared/storage.service";
import * as browser from 'webextension-polyfill';

@Injectable({
    providedIn: 'root'
})
/** Secure state service that holds the master keys in a key/value list of wallet ID and base64 encoded master key. */
export class SecureStateService {
    // The background.ts is responsible for clearing the secure state when timeout is reached.

    /** Contains the master seed for unlocked wallets. This object should never be persisted and only exists in memory. */
    
    // Made public to support a minor hack for frontend service.
    public keys: Map<string, string> = new Map<string, string>();

    unlockedWalletsSubject: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

    get unlockedWallets$(): Observable<string[]> {
        return this.unlockedWalletsSubject.asObservable();
    }

    constructor(private ngZone: NgZone, private runtime: RuntimeService, private storage: StorageService) {
        // TODO: Add support for fallback on storage.
        if (runtime.isExtension) {
            const storageApi = browser.storage as any;

            if (storageApi.session != null) {
                // Each instance of extension need this listener when session is cleared.
                storageApi.session.onChanged.addListener(async (changes: any) => {
                    this.ngZone.run(async () => {
                        // TODO: Find a better solution than checking the sizes of keys to redirect
                        // to home when timeout is reached.
                        const previousCount = this.keys.size;

                        await this.load();

                        const newCount = this.keys.size;

                        // Update the unlocked wallet subject with only the keys (wallet IDs).
                        this.unlockedWalletsSubject.next(<string[]>Array.from(this.keys.keys()));

                        // If there previously was more than 0 unlocked and there are no 0 unlocked,
                        // we must ensure that we send user to unlock screen.
                        // if (previousCount > 0 && newCount == 0) {
                        //     // TODO: This should truly only be an event and not a physical redirect. Separation of concerns here...
                        //     debugger;
                        //     this.router.navigateByUrl('/home');
                        // }
                    });
                });
            }
        }
    }

    async set(key: string, value: string) {
        // Update the keys, then persist it.
        this.keys.set(key, value);

        if (this.runtime.isExtension) {
            // Only on extensions will we listen to the event and reload cross instances. That is not possible on mobile / browser.
            const storageApi = browser.storage as any;
            // This will trigger an onChange event and reload the same keys. This will happens twice
            // in the instance that called set, but only once for other instances of the extension.
            await storageApi.session.set({ 'keys': Object.fromEntries(this.keys.entries()) });

            await this.storage.set('active', new Date().toJSON(), true);
            // Every time a new key is set, we'll update the active value as well.
        } else {
            await this.storage.set('active', new Date().toJSON(), true);
        }
    }

    get(key: string) {
        return this.keys.get(key);
    }

    unlocked(key: string) {
        return this.keys.get(key) != null;
    }

    async load() {
        let keys = await this.storage.get('keys', false);

        if (keys != null && Object.keys(keys).length > 0) {
            this.keys = new Map<string, string>(Object.entries(keys))
        } else {
            this.keys = new Map<string, string>();
        }

        this.unlockedWalletsSubject.next(<string[]>Array.from(this.keys.keys()));
    }
}
