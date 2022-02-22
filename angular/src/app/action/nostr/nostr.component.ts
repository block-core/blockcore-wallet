import { Component, ChangeDetectorRef, ApplicationRef, NgZone, OnInit } from '@angular/core';
import { CryptoService } from '../../services/crypto.service';
import { UIState } from '../../services/ui-state.service';
import { Router } from '@angular/router';
import { OrchestratorService } from '../../services/orchestrator.service';
import { NetworksService } from '../../services/networks.service';
import { CommunicationService } from '../../services/communication.service';

@Component({
    selector: 'app-nostr',
    templateUrl: './nostr.component.html',
    styleUrls: ['./nostr.component.css']
})
export class ActionNostrIdentityComponent implements OnInit {
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
        public networkService: NetworksService,
        private manager: OrchestratorService,
        private cd: ChangeDetectorRef) {
        this.uiState.title = 'Nostr Identity';

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
        this.callback = payload.replace('web+nostrid', 'https');
        this.content = payload.replace('web+nostrid://', '');

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

    sign() {
        // this.manager.signCallbackToUrl(this.content, this.uiState.action?.tabId, this.callback);
    }

    async exit() {
        await this.manager.clearAction();
    }

    async close() {
        await this.manager.clearAction();
        window.close();
    }
}
