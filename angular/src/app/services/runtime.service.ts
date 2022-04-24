import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class RuntimeService {
    private _isExtension;

    constructor() {
        this._isExtension = (globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.tabs);
    }

    get isExtension() {
        return this._isExtension;
    }

    getManifest(): chrome.runtime.Manifest {
        if (this._isExtension) {
            return chrome.runtime.getManifest();
        }
        else {
            return {
                name: 'Extension',
                version: '1.0.0',
                manifest_version: 3
            }
        }
    }
}
