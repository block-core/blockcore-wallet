import { Injectable, NgZone } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
/** Abstracts the storage API. */
export class StateService {
    private values: Map<string, any> = new Map<string, any>();

    // valuesSubject: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

    // get values$(): Observable<string[]> {
    //     return this.valuesSubject.asObservable();
    // }

    constructor(private ngZone: NgZone) {
        const storage = globalThis.chrome.storage;

        if (globalThis.chrome && globalThis.chrome.storage) {
            // Each instance of extension need this listener when session is cleared.
            storage.onChanged.addListener(async (changes: any, namespace: any) => {
                this.ngZone.run(async () => {
                    // TODO: We should consider looking into this changed
                    // event and inform across all instances of the extension, 
                    // if this state service key is marked as "shared" or not.

                    // Update the unlocked wallet subject with only the keys (wallet IDs).
                    // this.unlockedWalletsSubject.next(<string[]>Array.from(this.keys.keys()));
                });
            });
        }
    }

    /** Persists the value and keeps an in-memory reference until replaced or unloaded. 
     * The consumer of this API is responsible to ensure the value can be serialized to JSON. */
    async set(key: string, value: any) {
        if (globalThis.chrome && globalThis.chrome.storage) {
            const storage = globalThis.chrome.storage;

            // Update the values, then persist it.
            this.values.set(key, value);

            // To avoid conflicts, we will prefix this generic state storage service.
            await storage.local.set({ 'state_': value });
        }
    }

    async get<T>(key: string): Promise<T> {
        if (!this.values.get(key)) {
            await this.load(key);
        }

        return this.values.get(key);
    }

    async load(key: string) {
        if (globalThis.chrome && globalThis.chrome.storage) {
            const storage = globalThis.chrome.storage;
            let { value } = await storage.local.get(['state_' + key]);
            this.values.set(key, value);
        }
    }
}
