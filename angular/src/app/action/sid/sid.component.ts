import { Component, ChangeDetectorRef, ApplicationRef, NgZone, OnInit } from '@angular/core';
import { CryptoService } from '../../services/crypto.service';
import { UIState } from '../../services/ui-state.service';
import { Router } from '@angular/router';
import { NetworksService } from '../../services/networks.service';
import { CommunicationService } from '../../services/communication.service';
import { WalletManager } from '../../services/wallet-manager';
import axios from 'axios';
import { AppManager } from '../../services/application-manager';

@Component({
    selector: 'app-sid',
    templateUrl: './sid.component.html',
    styleUrls: ['./sid.component.css']
})
export class ActionStratisIdentityComponent implements OnInit {
    content?: string;
    parameters?: any;
    expiryDate: Date;
    callback: string;
    sub: any;
    result: string;
    success?: boolean;
    status = 0;

    constructor(
        public uiState: UIState,
        private crypto: CryptoService,
        private router: Router,
        private app: ApplicationRef,
        private ngZone: NgZone,
        private communication: CommunicationService,
        private manager: AppManager,
        public networkService: NetworksService,
        public walletManager: WalletManager,
        private cd: ChangeDetectorRef) {
        this.uiState.title = 'Stratis Identity';

    }

    ngOnDestroy(): void {
        if (this.sub) {
            this.communication.unlisten(this.sub);
        }
    }

    ngOnInit() {
        const payload = this.uiState.action?.document;
        const parts = payload.split('?');
        this.parameters = Object.fromEntries(new URLSearchParams(parts[1])) as any;

        this.expiryDate = new Date(this.parameters.exp * 1000);
        this.callback = payload.replace('web+sid', 'https');
        this.content = payload.replace('web+sid://', '');

        this.sub = this.communication.listen('signed-content-and-callback-to-url', (data: { success: boolean, data: any }) => {
            if (data.success) {
                this.status = 1;
                this.success = true;
            } else {
                this.status = 2;
                this.result = data.data;
                console.log(data.data);
            }
        });
    }

    async sign() {
        // this.manager.signCallbackToUrl(this.content, this.uiState.action?.tabId, this.callback);

        // const wallet = this.walletManager.getWallet(data.walletId);
        // const account = this.walletManager.getAccount(wallet, data.accountId);

        // if (!wallet || !account) {
        //     chrome.tabs.sendMessage(Number(data.tabId), { content: 'No wallet/account active.' });
        //     return;
        // }

        if (!this.walletManager.isActiveWalletUnlocked()) {
            throw Error('Active wallet is not unlocked.');
        }

        // TODO: Provide the address from the Action UI.
        const address = this.walletManager.activeAccount.state.receive[0].address;

        const signature = await this.walletManager.signData(this.walletManager.activeWallet, this.walletManager.activeAccount, address, this.content);

        const payload = {
            "signature": signature,
            "publicKey": address
        };

        console.log(payload);

        // Perform HTTP post call with payload!
        const authRequest = await axios.post(this.callback, payload);
        console.log(authRequest);

        if (authRequest.status == 204) {
            // TODO: Figure out if we should inform all or just source for this event.
            // this.communication.sendToAll('signed-content-and-callback-to-url', { success: true });
            // this.manager.communication.send(port, 'signed-content-and-callback-to-url');
        } else {
            // TODO: Figure out if we should inform all or just source for this event.
            // this.communication.sendToAll('signed-content-and-callback-to-url', { success: false, data: authRequest.data });
            // this.manager.communication.send(port, 'signed-content-and-callback-to-url');
        }
    }

    exit() {
        this.manager.clearAction();
    }

    close() {
        this.manager.clearAction();
        window.close();
    }
}
