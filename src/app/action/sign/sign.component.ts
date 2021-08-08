import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../../services/crypto.service';
import { UIState } from '../../services/ui-state.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-sign',
    templateUrl: './sign.component.html',
    styleUrls: ['./sign.component.css']
})
export class ActionSignComponent {
    mnemonic = '';
    password = '';
    unlocked = '';
    unlockPassword = '';
    alarmName = 'refresh';
    wallet: any;

    constructor(
        public uiState: UIState,
        private crypto: CryptoService,
        private router: Router,
        private app: ApplicationRef,
        private ngZone: NgZone,
        private cd: ChangeDetectorRef) {

        this.uiState.title = 'Action: Signing';

        // this.ngZone.run(() => this.router.navigate(["login"])).then();

    }

    exit() {
        // Set the action in storage and close the action
        chrome.storage.local.set({ action: null }, () => {
            // this.app.tick();
            this.ngZone.run(() => {
                this.uiState.title = '';
                this.uiState.loading = true;
                this.router.navigateByUrl('/');
            });
        });
    }
}
