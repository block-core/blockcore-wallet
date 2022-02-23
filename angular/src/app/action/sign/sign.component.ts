import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../../services/crypto.service';
import { UIState } from '../../services/ui-state.service';
import { Router } from '@angular/router';
import { NetworksService } from '../../services/networks.service';
import { AppManager } from '../../services/application-manager';
import { WalletManager } from '../../services/wallet-manager';

@Component({
    selector: 'app-sign',
    templateUrl: './sign.component.html',
    styleUrls: ['./sign.component.css']
})
export class ActionSignComponent {
    content?: string;

    constructor(
        public uiState: UIState,
        private crypto: CryptoService,
        private router: Router,
        private app: ApplicationRef,
        private ngZone: NgZone,
        public networkService: NetworksService,
        public walletManager: WalletManager,
        private manager: AppManager,
        private cd: ChangeDetectorRef) {
        this.uiState.title = 'Action: Signing';

        this.content = this.uiState.action?.document;
    }

    sign() {
        // this.manager.sign(this.content, this.uiState.action?.tabId);
        window.close();
    }

    exit() {
        this.manager.clearAction();
    }
}
