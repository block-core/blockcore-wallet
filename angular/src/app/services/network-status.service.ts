import { Injectable } from '@angular/core';
import { NetworkStatus } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class NetworkStatusService {
    private networks: Map<string, NetworkStatus> = new Map<string, NetworkStatus>();

    set(network: NetworkStatus) {
        this.networks.set(network.networkType, network);
    }

    get(networkType: string) {
        return this.networks.get(networkType);
    }
}
