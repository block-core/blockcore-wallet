import { Injectable } from "@angular/core";
import { Settings } from "../interfaces";
import { AUTO_TIMEOUT, INDEXER_URL, VAULT_URL } from "../shared/constants";

@Injectable({
    providedIn: 'root'
})
/** Used to access and manage settings. This service will fall back to localStorage when running outside of extension ("chrome") context. */
export class SettingsService {
    private _values: Settings;

    constructor(
    ) {

    }

    get values(): Settings {
        return this._values;
    }

    async replace(settings: Settings) {
        this._values = settings;

        await this.save();
    }

    async load() {
        if (globalThis.chrome && globalThis.chrome.storage) {
            const result = await globalThis.chrome.storage.local.get('settings');
            this._values = result['settings'];
        } else {
            this._values = JSON.parse(globalThis.localStorage.getItem('settings'));
        }

        if (this._values == null) {
            this._values = this.defaultSettings();
        }
    }

    async save(): Promise<void> {
        if (this._values == null) {
            this._values = this.defaultSettings();
        }

        if (globalThis.chrome && globalThis.chrome.storage) {
            await globalThis.chrome.storage.local.set({ 'settings': this._values });
        } else {
            globalThis.localStorage.setItem('settings', JSON.stringify(this._values));
        }
    }

    private defaultSettings() {
        return {
            autoTimeout: AUTO_TIMEOUT,
            indexer: INDEXER_URL,
            dataVault: VAULT_URL,
            theme: 'dark',
            themeColor: 'primary',
            language: 'en',
            amountFormat: 'bitcoin',
            developer: false
        };
    }
}