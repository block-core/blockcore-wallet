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
}
