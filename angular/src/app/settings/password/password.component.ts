import { Location } from '@angular/common';
import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UIState, WalletManager } from '../../services';

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

    constructor(
        public uiState: UIState,
        public location: Location,
        private snackBar: MatSnackBar,
        public walletManager: WalletManager,
        private router: Router
    ) {
        this.uiState.title = 'Change password';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;

    }

    ngOnDestroy() {

    }

    async save() {
        if (this.newPassword !== this.confirmedPassword) {
            this.snackBar.open('The password input must be the same.', 'Hide', {
                duration: 4000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
            });
            return;
        }

        if (this.confirmedPassword == null || this.confirmedPassword.length === 0) {
            this.snackBar.open('The password cannot be empty.', 'Hide', {
                duration: 4000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
            });
            return;
        }

        try {
            // First make sure that existing password is valid:
            const validOldPassword = await this.walletManager.unlockWallet(this.walletManager.activeWallet?.id, this.existingPassword);

            if (!validOldPassword) {
                // TODO: ERROR MESSAGE!
                this.snackBar.open('The existing password is incorrect.', 'Hide', {
                    duration: 8000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom',
                });

                return;
            }

            const walletWasChanged = await this.walletManager.changeWalletPassword(this.walletManager.activeWallet?.id, this.existingPassword, this.confirmedPassword);

            if (walletWasChanged) {
                // If password was changed, lock the wallet.
                this.walletManager.lockWallet(this.walletManager.activeWallet.id);
                this.router.navigateByUrl('/home');
            } else {
                // TODO: ERROR MESSAGE!
                this.snackBar.open('Unable to change password on wallet for unknown reason.', 'Hide', {
                    duration: 8000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom',
                });
            }

        } catch (error) {
            // TODO: ERROR MESSAGE!
            this.snackBar.open('Error: ' + error.toString(), 'Hide', {
                duration: 8000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
            });
        }
    }

    cancel() {
        this.location.back();
    }
}
