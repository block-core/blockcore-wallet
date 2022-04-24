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
                name: 'Blockcore Browser Wallet',
                author: 'Blockcore',
                version: '0.0.1',
                manifest_version: 3,
                description: 'Non-Custodial web browser wallet for Coins, Tokens, Identities, NFTs and more.'
            }
        }
    }

    sendMessage<M = any, R = any>(message: M, responseCallback?: (response: R) => void) {
        if (this._isExtension) {
            chrome.runtime.sendMessage(message, (response) => {
                console.log('CommunicationService:send:response:', response);
            });
        } else {
            console.log('CommunicationService (BROWSER):send:', message);
        }
    }
}
