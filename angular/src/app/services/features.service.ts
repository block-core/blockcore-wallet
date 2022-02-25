
import { Injectable } from '@angular/core';
import { EnvironmentService } from './environment.service';

@Injectable({
    providedIn: 'root'
})
export class FeatureService {
    features: string[];

    constructor(private env: EnvironmentService) {
        this.features = env.features;
    }

    enabled(feature: string) {
        return this.features.includes(feature);
    }

    enabledGroup(featurePrefix: string) {
        // Check if any features starts with the prefix:
        return this.features.some(f => f.startsWith(featurePrefix));
    }
}
