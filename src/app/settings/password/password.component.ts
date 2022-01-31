import { Location } from '@angular/common';
import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UIState } from 'src/app/services/ui-state.service';
import { CommunicationService } from '../../services/communication.service';
import { OrchestratorService } from '../../services/orchestrator.service';

@Component({
    selector: 'app-password',
    templateUrl: './password.component.html',
    styleUrls: ['./password.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PasswordComponent implements OnDestroy {
    @HostBinding('class.privacy') hostClass = true;

    existingPassword?: string;
    newPassword?: string;
    confirmedPassword?: string;
    sub: any;

    constructor(
        public uiState: UIState,
        public location: Location,
        private snackBar: MatSnackBar,
        private manager: OrchestratorService,
        private communication: CommunicationService
    ) {
        this.uiState.title = 'Change password';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;

        this.sub = this.communication.listen('wallet-password-changed', (mnemonic: string) => {
            // When the password has changed, we'll lock the wallet so user must re-confirm the new password.
            this.manager.lock(this.uiState.activeWallet.id);
        });
    }

    ngOnDestroy() {
        if (this.sub) {
            this.communication.unlisten(this.sub);
        }
    }

    save() {
        if (this.newPassword !== this.confirmedPassword) {
            this.snackBar.open('The password input must be the same.', 'Hide', {
                duration: 4000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
            });
            return;
        }

        if (this.confirmedPassword.length === 0) {
            this.snackBar.open('The password cannot be empty.', 'Hide', {
                duration: 4000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
            });
            return;
        }

        this.communication.send('wallet-password-change', { walletId: this.uiState.activeWallet?.id, oldpassword: this.existingPassword, newpassword: this.confirmedPassword });
    }

    cancel() {
        this.location.back();
    }
}
