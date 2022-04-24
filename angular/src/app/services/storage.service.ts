import { Injectable } from "@angular/core";
import { RuntimeService } from "./runtime.service";

@Injectable({
    providedIn: 'root'
})
export class StorageService {

    constructor(private runtime: RuntimeService) {
    }

    async set(key: string, value: any) {
        if (this.runtime.isExtension) {
            await globalThis.chrome.storage.local.set({ key: value });
        }
        else {
            // "sessionStorage is similar to localStorage ; the difference is that while data in localStorage doesn't expire, data in sessionStorage is cleared when the page session ends.""
            globalThis.sessionStorage.setItem(key, JSON.stringify(value));
        }
    }

    async get(key: string) {
        if (this.runtime.isExtension) {
            const storage = globalThis.chrome.storage;
            let { keys } = await (<any>storage).session.get(['keys']);
            return keys;
        }
        else {
            // "sessionStorage is similar to localStorage ; the difference is that while data in localStorage doesn't expire, data in sessionStorage is cleared when the page session ends.""
            const item = globalThis.sessionStorage.getItem(key);
            return JSON.parse(item);
        }
    }
}
