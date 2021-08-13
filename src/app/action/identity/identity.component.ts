import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../../services/crypto.service';
import { UIState } from '../../services/ui-state.service';
import { Router } from '@angular/router';
import { OrchestratorService } from 'src/app/services/orchestrator.service';

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
        private manager: OrchestratorService,
        private cd: ChangeDetectorRef) {
        this.uiState.title = 'Action: Identity';

        this.content = 'The website is requesting you to generate an DID Document.'; // this.uiState.action?.document;
    }

    sign() {
        this.manager.sign(this.content, this.uiState.action?.tabId);
        window.close();
    }

    exit() {
        this.manager.clearAction();
    }
}
