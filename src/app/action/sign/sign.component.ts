import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../../services/crypto.service';
import { ApplicationState } from '../../services/application-state.service';
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
        public appState: ApplicationState,
        private crypto: CryptoService,
        private router: Router,
        private app: ApplicationRef,
        private ngZone: NgZone,
        private cd: ChangeDetectorRef) {

        this.appState.title = 'Action: Signing';

        // this.ngZone.run(() => this.router.navigate(["login"])).then();

    }

    exit() {
        // Set the action in storage and close the action
        chrome.storage.local.set({ action: null }, () => {
            // this.app.tick();
            this.ngZone.run(() => {
                this.appState.title = '';
                this.appState.loading = true;
                this.router.navigateByUrl('/');
            });
        });
    }
}
