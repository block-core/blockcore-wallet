import { RuntimeService } from "./runtime.service";
import * as browser from 'webextension-polyfill';

// This service is primarily only used for "active" and "timeout" keys.
export class StorageService {

    constructor(public runtime: RuntimeService) {
    }

    async set(key: string, value: any, persisted: boolean) {
        // console.log(`SET: ${key} PERSISTED: ${persisted}`);
        if (this.runtime.isExtension) {
            if (persisted) {
                await browser.storage.local.set({ [key]: value });
            } else {
                const storage = browser.storage as any;
                await storage.session.set({ [key]: value });
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
        // console.log(`GET: ${key} PERSISTED: ${persisted}`);
        if (this.runtime.isExtension) {
            if (persisted) {
                let { keys } = await browser.storage.local.get([key]) as any;
                return keys;
            } else {
                const storage = browser.storage as any;
                let { keys } = await storage.session.get([key]);
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
