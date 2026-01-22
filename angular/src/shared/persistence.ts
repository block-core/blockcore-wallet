import { Database } from "./store/storage";
import * as browser from 'webextension-polyfill';

/** Abstracts the storage API and relies on localStorage for unit tests/fallback. */
export class Persistence {
    db = Database.Instance;

    /** Check if running in extension context */
    private isExtension(): boolean {
        return !!(globalThis.chrome?.runtime?.id);
    }

    /** The consumer of this API is responsible to ensure the value can be serialized to JSON. */
    async set(key: string, value: any) {
        await this.db.putBucket(key, value);

        if (this.isExtension()) {
            await browser.storage.local.set({ [key]: value });
        } else {
            globalThis.localStorage.setItem(key, JSON.stringify(value));
        }
    }

    async get<T>(key: string): Promise<T> {
        const dbValue = await this.db.getBucket(key);

        if (dbValue) {
            return dbValue.value;
        }

        // If we can't find in the database, try to find in the storage.
        if (!dbValue) {
            if (this.isExtension()) {
                const value = await browser.storage.local.get(key) as any;

                // If it exists in the storage, put it in the database.
                if (value[key]) {
                    await this.db.putBucket(key, value[key]);
                }

                return value[key];
            } else {
                let value = globalThis.localStorage.getItem(key);

                if (value) {
                    // If it exists in the storage, put it in the database.
                    await this.db.putBucket(key, JSON.parse(value));

                    return JSON.parse(value);
                } else {
                    return undefined;
                }
            }
        } else {
            return undefined;
        }
    }

    async remove(key: string) {
        await this.db.deleteBucket(key);

        if (this.isExtension()) {
            await browser.storage.local.remove(key);
        } else {
            globalThis.localStorage.removeItem(key);
        }
    }
}
