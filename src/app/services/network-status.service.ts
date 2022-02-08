import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import * as bip39 from 'bip39';
import { Base64 } from 'js-base64';
import { NetworkLoader } from '../../background/network-loader';
import { Network } from '../../background/networks';
import { Account, NetworkStatus, Wallet } from '../interfaces';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NetworkStatusService {
    public networks$ = new BehaviorSubject<NetworkStatus[]>([]);

    constructor() {

    }

    async updateAll(networks: NetworkStatus[]) {
        this.networks$.next(networks);
    }
}
