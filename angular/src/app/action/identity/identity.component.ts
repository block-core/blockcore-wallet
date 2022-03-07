import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService, NetworksService, AppManager, WalletManager, UIState } from '../../services';
import { Router } from '@angular/router';
import { ActionService } from 'src/app/services/action.service';

@Component({
    selector: 'app-identity',
    templateUrl: './identity.component.html',
    styleUrls: ['./identity.component.css']
})
export class ActionIdentityComponent {
    content?: string;

    constructor(
        public uiState: UIState,
        private crypto: CryptoService,
        private router: Router,
        private app: ApplicationRef,
        private ngZone: NgZone,
        private action: ActionService,
        public networkService: NetworksService,
        private manager: AppManager,
        public walletManager: WalletManager,
        private cd: ChangeDetectorRef) {
        this.uiState.title = 'Action: Identity';

        this.content = 'The website is requesting you to generate an DID Document.'; // this.uiState.action?.document;
    }

    sign() {
        // this.manager.sign(this.content, this.uiState.action?.tabId);
        window.close();
    }

    exit() {
        this.action.clearAction();
    }
}
