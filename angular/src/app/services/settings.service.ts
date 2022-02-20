import { Injectable } from "@angular/core";
import { __values } from "tslib";

export class SettingsData {
    public theme: string;
}

@Injectable({
    providedIn: 'root'
})
/** Used to access and manage settings. This service will fall back to localStorage when running outside of extension ("chrome") context. */
export class SettingsService {
    private _values: SettingsData;

    constructor(
    ) {

    }

    get values(): SettingsData {
        return this._values;
    }

    async load() {
        if (globalThis.chrome && globalThis.chrome.storage) {
            const result = await globalThis.chrome.storage.local.get('settings');
            this._values = result['settings'];
        } else {
            this._values = JSON.parse(globalThis.localStorage.getItem('settings'));
        }

        if (this._values == null) {
            this._values = new SettingsData();
        }
    }

    async save(): Promise<void> {
        if (this._values == null) {
            this._values = new SettingsData();
        }

        if (globalThis.chrome && globalThis.chrome.storage) {
            await globalThis.chrome.storage.local.set({ 'settings': this._values });
        } else {
            globalThis.localStorage.setItem('settings', JSON.stringify(this._values));
        }
    }
}