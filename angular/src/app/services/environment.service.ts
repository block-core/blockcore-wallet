import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Environments } from '../../environments/environments';
import { IEnvironment } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class EnvironmentService implements IEnvironment {
    get production() {
        return environment.production;
    }

    get enableDebugTools() {
        return environment.enableDebugTools;
    }

    get logLevel() {
        return environment.logLevel;
    }

    get version() {
        return environment.version;
    }

    get features() {
        return environment.features;
    }

    get releaseUrl() {
        return environment.releaseUrl;
    }

    get sourceUrl() {
        return environment.sourceUrl;
    }

    get instance() {
        return environment.instance;
    }

    get instanceName() {
        return environment.instanceName;
    }

    get instanceUrl() {
        return environment.instanceUrl;
    }

    get instanceExplorerUrl() {
        return environment.instanceExplorerUrl;
    }

    get networks() {
        return environment.networks;
    }

    constructor() { }
}