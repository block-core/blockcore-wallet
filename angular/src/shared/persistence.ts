import { Database } from "./store/storage";

/** Abstracts the storage API and relies on localStorage for unit tests/fallback. */
export class Persistence {
    db = Database.Instance;

    /** The consumer of this API is responsible to ensure the value can be serialized to JSON. */
    async set(key: string, value: any) {
        await this.db.putBucket(key, value);

        if (globalThis.chrome && globalThis.chrome.storage) {
            await globalThis.chrome.storage.local.set({ [key]: value });
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
            if (globalThis.chrome && globalThis.chrome.storage) {
                const value = await globalThis.chrome.storage.local.get(key);
                return value[key];
            } else {
                let value = globalThis.localStorage.getItem(key);

                if (value) {
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

        if (globalThis.chrome && globalThis.chrome.storage) {
            await globalThis.chrome.storage.local.remove(key);
        } else {
            globalThis.localStorage.removeItem(key);
        }
    }
}
