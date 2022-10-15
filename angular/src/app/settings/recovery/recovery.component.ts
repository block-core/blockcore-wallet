import { Location } from '@angular/common';
import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { UIState, WalletManager } from '../../services';
import { copyToClipboard } from '../../shared/utilities';

@Component({
    selector: 'app-recovery',
    templateUrl: './recovery.component.html',
    styleUrls: ['./recovery.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class RecoveryComponent implements OnDestroy {
    @HostBinding('class.privacy') hostClass = true;

    password?: string;

    mnemonic: string = '';

    constructor(
        public uiState: UIState,
        public walletManager: WalletManager,
        private snackBar: MatSnackBar,
        public location: Location,
        public translate: TranslateService) {
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;

    }

    async ngOnInit() {
      this.uiState.title = await this.translate.get('Settings.ShowSecretRecoveryPhrase').toPromise();
    }

    ngOnDestroy() {
        this.mnemonic = '';
    }

    async show() {
        var recoveryPhrase = await this.walletManager.revealSecretRecoveryPhrase(this.walletManager.activeWallet?.id, this.password);

        if (recoveryPhrase) {
            this.mnemonic = recoveryPhrase;
        } else {
            // TODO: MAKE ERROR HANDLING SERVICE!
            this.snackBar.open('Invalid password', 'Hide', {
                duration: 2500,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
            });
        }
    }

    cancel() {
        this.mnemonic = '';
        this.location.back();
    }

    copy() {
        copyToClipboard(this.mnemonic);
    }
}
