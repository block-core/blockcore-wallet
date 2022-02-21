import { Location } from '@angular/common';
import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommunicationService } from 'src/app/services/communication.service';
import { UIState } from 'src/app/services/ui-state.service';
import { copyToClipboard } from 'src/app/shared/utilities';
import { WalletManager } from '../../../background/wallet-manager';

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
        public location: Location,
        private communication: CommunicationService) {
        this.uiState.title = 'Recovery Phrase';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;

    }

    ngOnDestroy() {
        this.mnemonic = '';
    }

    async show() {
        var recoveryPhrase = await this.walletManager.revealSecretRecoveryPhrase(this.uiState.activeWallet?.id, this.password);

        if (recoveryPhrase) {
            this.mnemonic = recoveryPhrase;

            // Make sure we inform all instances when a wallet is unlocked.
            this.communication.sendToAll('wallet-exported-recovery-phrase', recoveryPhrase);
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
