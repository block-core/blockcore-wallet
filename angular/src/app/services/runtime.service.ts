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

    async getManifest(): Promise<chrome.runtime.Manifest> {
        if (this.isExtension) {
            return chrome.runtime.getManifest();
        }
        else {

            // Default options are marked with *
            const response = await fetch('/manifest.webmanifest', {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
            });

            const manifest = await response.json();
            return manifest;
        }
    }
}
