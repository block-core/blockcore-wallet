import { Account, State, Wallet, Action, DIDPayload, Settings, Identity, Vault } from '../app/interfaces';
import { MINUTE, NETWORK_IDENTITY } from '../app/shared/constants';
import { AppState } from './application-state';
import { CommunicationBackgroundService } from './communication';
import { CryptoUtility } from './crypto-utility';
import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import { decodeJWT, verifyJWT } from 'did-jwt';
import { settings } from 'cluster';
import { ServiceEndpoint } from 'did-resolver';
import { keyUtils, Secp256k1KeyPair } from '@transmute/did-key-secp256k1';
import { BlockcoreIdentity } from '@blockcore/identity';
import { Issuer } from 'did-jwt-vc';
import { AppManager } from './application-manager';
const axios = require('axios');

class Queue {
    items: any[];

    constructor(...params: any[]) {
        console.log(params);
        this.items = [...params];
    }

    enqueue(item: any) {
        this.items.push(item);
    }

    dequeue() {
        return this.items.shift();
    }

    getItems() {
        return this.items
    }

    isEmpty() {
        return this.items.length == 0;
    }

    peek() {
        return !this.isEmpty() ? this.items[0] : undefined;
    }

    length() {
        return this.items.length;
    }
}


/** Service that handles queries against the blockchain indexer to retrieve data for accounts. Runs in the background. */
export class IndexerService {
    timer: any;
    private communication!: CommunicationBackgroundService;
    private state!: AppState;
    private crypto!: CryptoUtility;
    private q = new Queue();

    constructor(private manager: AppManager) {

    }

    process(account: Account, wallet: Wallet) {

        const empty = this.q.isEmpty();

        // Registers in queue processing of the account in specific wallet.
        this.q.enqueue({ account, wallet });

        // If the queue is empty, we'll schedule processing with a timeout.
        if (empty) {
            // Queue up in one second
            setTimeout(() => {
                this.queryIndexer();
            }, 1000);
        }
    }

    queryIndexer() {
        while (!this.q.isEmpty()) {
            debugger;
            const item = this.q.dequeue();

            const account = item.account as Account;
            const wallet = item.wallet as Wallet;
            const network = this.manager.getNetwork(account.network, account.purpose);
            const indexerUrl = this.manager.state.persisted.settings.indexer.replace('{id}', network.id.toLowerCase());

            console.log('Indexer URL:', indexerUrl);

            // Loop through all receive indexes until no more data is found:
            for (let i = 0; i < account.state.receive.length; i++) {
                let receiveAddress = account.state.receive[i];

                // receiveAddress.address

                //              // Perform a map operation on all receive addresses to extend the array with result from indexer results.
                //   data.receive.map(async item => {

                //     try {
                //       let result: any = await this.http.get(`http://localhost:9910/api/query/address/${item.address}`).toPromise();

                //       item.icon = 'history';
                //       item.title = 'Received: ' + result.totalReceived + ' to ' + result.address;

                //       let activity = {
                //         ...item,
                //         ...result
                //       };

                //       this.activities.push(activity);
                //       console.log('activity:', activity);

                //       // this.activities = [{
                //       //   icon: 'history',
                //       //   amount: 50,
                //       //   title: 'Received 50 STRAX',
                //       //   status: 'Confirming...',
                //       //   timestamp: new Date()
                //       // }, {
                //       //   icon: 'done',
                //       //   amount: 10,
                //       //   title: 'Sent 10 STRAX to XNfU57hAwQ1uWYRHjusas8MFCUQetuuX6o',
                //       //   status: 'Success',
                //       //   timestamp: new Date()
                //       // }]

                //     }
                //     catch (error: any) {
                //       console.log('oops', error);

                //       if (error.error?.title) {
                //         this.snackBar.open('Error: ' + error.error.title, 'Hide', {
                //           duration: 8000,
                //           horizontalPosition: 'center',
                //           verticalPosition: 'bottom',
                //         });
                //       } else {
                //         this.snackBar.open('Error: ' + error.message, 'Hide', {
                //           duration: 8000,
                //           horizontalPosition: 'center',
                //           verticalPosition: 'bottom',
                //         });
                //       }
                //     }

                //     // let result = await this.http.get(`http://localhost:9910/api/query/address/${item.address}`).subscribe(result => {
                //     // }, error => {

                //     // });
                //   });

            }

            // account.state.receive
            // account.state.receive

        }

        // this.manager.communication.sendToAll('account-data-updated');
    }
}