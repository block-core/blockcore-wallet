/** Abstracts the storage API and relies on localStorage for unit tests/fallback. */
export class StateStore {
    /** The consumer of this API is responsible to ensure the value can be serialized to JSON. */
    async set(key: string, value: any) {
        if (globalThis.chrome && globalThis.chrome.storage) {
            await globalThis.chrome.storage.local.set({ [key]: value });
        } else {
            globalThis.localStorage.setItem(key, JSON.stringify(value));
        }
    }

    async get<T>(key: string): Promise<T> {
        if (globalThis.chrome && globalThis.chrome.storage) {
            let { value } = await globalThis.chrome.storage.local.get([key]);
            return value;
        } else {
            let value = globalThis.localStorage.getItem(key);

            if (value) {
                return JSON.parse(value);
            } else {
                return undefined;
            }
        }
    }

    async remove(key: string) {
        if (globalThis.chrome && globalThis.chrome.storage) {
            await globalThis.chrome.storage.local.remove(key);
        } else {
            globalThis.localStorage.removeItem(key);
        }
    }
}
