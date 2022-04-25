import { Injectable } from "@angular/core";
import { SharedManager } from "src/shared/shared-manager";

@Injectable({
    providedIn: 'root'
})
export class RuntimeService {
    private shared;

    constructor() {
        this.shared = new SharedManager();
    }

    get isExtension() {
        return this.shared.isExtension;
    }

    getManifest(): chrome.runtime.Manifest {
        if (this.isExtension) {
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

    // sendMessage<M = any, R = any>(message: M, responseCallback?: (response: R) => void) {
    //     if (this._isExtension) {
    //         chrome.runtime.sendMessage(message, (response) => {
    //             console.log('CommunicationService:send:response:', response);
    //         });
    //     } else {
    //         console.log('CommunicationService (BROWSER):send:', message);
    //     }
    // }
}
