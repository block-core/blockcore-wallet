import { Component, ChangeDetectorRef, ApplicationRef, NgZone, OnInit } from '@angular/core';
import { CryptoService } from '../../services/crypto.service';
import { UIState } from '../../services/ui-state.service';
import { Router } from '@angular/router';
import { OrchestratorService } from '../../services/orchestrator.service';
import { NetworksService } from '../../services/networks.service';

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

    constructor(
        public uiState: UIState,
        private crypto: CryptoService,
        private router: Router,
        private app: ApplicationRef,
        private ngZone: NgZone,
        public networkService: NetworksService,
        private manager: OrchestratorService,
        private cd: ChangeDetectorRef) {
        this.uiState.title = 'Stratis Identity';

    }

    ngOnInit() {
        const payload = this.uiState.action?.document;
        const parts = payload.split('?');
        this.parameters = Object.fromEntries(new URLSearchParams(parts[1])) as any;

        this.expiryDate = new Date(this.parameters.exp * 1000);
        this.callback = payload.replace('web+sid', 'https');
        this.content = payload.replace('web+sid://', '');
    }

    sign() {
        this.manager.sign(this.content, this.uiState.action?.tabId);
        window.close();
    }

    exit() {
        this.manager.clearAction();
    }
}
