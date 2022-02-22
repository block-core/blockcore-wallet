import { Location } from '@angular/common';
import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UIState } from '../../services/ui-state.service';
import { copyToClipboard } from '../../shared/utilities';
import { WalletManager } from '../../services/wallet-manager';

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
        private walletManager: WalletManager,
        private snackBar: MatSnackBar,
        public location: Location) {
        this.uiState.title = 'Recovery Phrase';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;

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
