import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import * as bip39 from 'bip39';
import { Base64 } from 'js-base64';

const enc = new TextEncoder();
const dec = new TextDecoder();

@Injectable({
    providedIn: 'root'
})
export class FeatureService {
    features: string[];

    constructor() {
        this.features = environment.features;
    }

    enabled(feature: string) {
        return this.features.includes(feature);
    }

    enabledGroup(featurePrefix: string) {
        // Check if any features starts with the prefix:
        return this.features.some(f => f.startsWith(featurePrefix));
    }
}
