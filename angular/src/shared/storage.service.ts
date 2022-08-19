import { RuntimeService } from "./runtime.service";

export class StorageService {

    constructor(public runtime: RuntimeService) {
    }

    async set(key: string, value: any, persisted: boolean) {
        if (this.runtime.isExtension) {
            if (persisted) {
                await globalThis.chrome.storage.local.set({ [key]: value });
            } else {
                const storage = globalThis.chrome.storage;
                await (<any>storage).session.set({ [key]: value });
            }
        } else {
            if (persisted) {
                globalThis.localStorage.setItem(key, JSON.stringify({ [key]: value }));
            } else {
                // "sessionStorage is similar to localStorage ; the difference is that while data in localStorage doesn't expire, 
                // data in sessionStorage is cleared when the page session ends."
                globalThis.sessionStorage.setItem(key, JSON.stringify({ [key]: value }));
            }
        }
    }

    async get(key: string, persisted: boolean) {
        if (this.runtime.isExtension) {
            if (persisted) {
                let { keys } = await globalThis.chrome.storage.local.get(['keys']);
                return keys;
            } else {
                const storage = globalThis.chrome.storage;
                let { keys } = await (<any>storage).session.get(['keys']);
                return keys;
            }
        } else {
            if (persisted) {
                // "sessionStorage is similar to localStorage ; the difference is that while data in localStorage doesn't expire, 
                // data in sessionStorage is cleared when the page session ends."
                const item = globalThis.localStorage.getItem(key);

                if (item == null) {
                    return null;
                } else {
                    return JSON.parse(item)[key];
                }
            } else {
                // "sessionStorage is similar to localStorage ; the difference is that while data in localStorage doesn't expire, 
                // data in sessionStorage is cleared when the page session ends."
                const item = globalThis.sessionStorage.getItem(key);

                if (item == null) {
                    return null;
                } else {
                    return JSON.parse(item)[key];
                }
            }
        }
    }
}
