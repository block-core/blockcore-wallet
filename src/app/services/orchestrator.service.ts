import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UIState } from './ui-state.service';
import { CommunicationService } from './communication.service';
import { Account, Action, Identity, Settings, State, Vault } from '../interfaces';
import {
    MatSnackBar,
    MatSnackBarHorizontalPosition,
    MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})
export class OrchestratorService {
    constructor(
        private communication: CommunicationService,
        private uiState: UIState,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        console.log('OrchestratorService constructor.');
        debugger;
        // this.eventHandlers();
    }

    initialize() {
        console.log('OrchestratorService wiring up listeners.');
        this.eventHandlers();
    }

    private eventHandlers() {
        this.communication.listen('wallet-locked', () => this.router.navigateByUrl('/'));
        // this.communication.listen('unlocked', () => this.uiState.unlocked = true);

        // Whenever the UI-state changes, update it.
        // this.communication.listen('ui-state', (value: any) => {
        //     console.log('ui-state updated!');
        //     this.uiState.persisted = value;
        // });

        // Whenever the state is updated, we'll update in the UI.
        this.communication.listen('state-loaded', (state: State) => {

            // Loading has completed.
            this.uiState.loading = false;

            debugger;
            console.log('EVENT: state-loaded', state);
            this.uiState.initialized = true;
            this.uiState.action = state.action;
            this.uiState.persisted = state.persisted;
            this.uiState.store = state.store;
            this.uiState.unlocked = state.unlocked;

            this.uiState.persisted$.next(this.uiState.persisted);
            this.uiState.activeWalletSubject.next(this.uiState.activeWallet);
            this.uiState.activeAccountSubject.next(this.uiState.activeAccount);

            // If an action has been triggered, we'll always show action until user closes the action.
            if (this.uiState.action?.action && this.uiState.activeWallet && this.uiState.unlocked.indexOf(this.uiState.activeWallet.id) > -1) {
                // TODO: Add support for more actions.
                this.router.navigate(['action', this.uiState.action?.action]);
            } else {
                // If the state was changed and there is no wallets, send user to create wallet UI.
                if (!this.uiState.hasWallets) {
                    this.router.navigateByUrl('/wallet/create');
                } else {
                    // If the active wallet is unlocked, we'll redirect accordingly.
                    if (this.uiState.activeWallet && this.uiState.unlocked.indexOf(this.uiState.activeWallet.id) > -1) {
                        console.log('LOADING REDIRECT TO ACCOUNT');
                        this.router.navigateByUrl('/dashboard');
                        //this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet.activeAccountIndex);
                    } else {
                        // When the initial state is loaded and user has not unlocked any wallets, we'll show the unlock screen on home.
                        console.log('LOADING REDIRECT TO HOME');
                        this.router.navigateByUrl('/home');
                    }
                }
            }
        });

        // Whenever the state is updated, we'll update in the UI.
        this.communication.listen('state-changed', (state: State) => {
            debugger;
            console.log('EVENT: state-changed', state);
            this.uiState.initialized = true;
            this.uiState.action = state.action;
            this.uiState.persisted = state.persisted;
            this.uiState.store = state.store;
            this.uiState.unlocked = state.unlocked;

            this.uiState.persisted$.next(this.uiState.persisted);
            this.uiState.activeWalletSubject.next(this.uiState.activeWallet);
            this.uiState.activeAccountSubject.next(this.uiState.activeAccount);

            // // If an action has been triggered, we'll always show action until user closes the action.
            // if (this.uiState.action?.action && this.uiState.activeWallet && this.uiState.unlocked.indexOf(this.uiState.activeWallet.id) > -1) {
            //     // TODO: Add support for more actions.
            //     this.router.navigate(['action', this.uiState.action?.action]);
            // } else {
            //     // If the state was changed and there is no wallets, send user to create wallet UI.
            //     if (!this.uiState.hasWallets) {
            //         this.router.navigateByUrl('/wallet/create');
            //     }

            //     // else {
            //     //     // If the active wallet is unlocked, we'll redirect accordingly.
            //     //     if (this.uiState.activeWallet && this.uiState.unlocked.indexOf(this.uiState.activeWallet.id) > -1) {
            //     //         console.log('LOADING REDIRECT TO ACCOUNT');
            //     //         this.router.navigateByUrl('/dashboard');
            //     //         //this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet.activeAccountIndex);
            //     //     } else {
            //     //         console.log('LOADING REDIRECT TO HOME');
            //     //         this.router.navigateByUrl('/home');
            //     //     }
            //     // }
            // }
        });

        // When an action is triggered from the content script / background.
        this.communication.listen('action', (action: Action) => {
            console.log('action', action);
            this.uiState.action = action;
        });

        // When action has been reset, ensure that UI instances redirect to root.
        this.communication.listen('action-changed', (action: Action) => {
            if (!action.action) {
                this.router.navigateByUrl('/');
            }
        });

        // When a wallet is removed, we must update UI.
        this.communication.listen('wallet-removed', (value: any) => {
            // We'll always redirect to root when a wallet is removed.
            this.router.navigateByUrl('/');

            // this.uiState.persisted.wallets.splice(this.uiState.persisted.activeWalletIndex, 1);

            // if (this.uiState.hasWallets) {
            //   this.uiState.persisted.activeWalletIndex = 0;
            // } else {
            //   this.uiState.persisted.activeWalletIndex = -1;
            // }

            // await this.uiState.save();


        });

        // When a wallet is removed, we must update UI.
        this.communication.listen('error', (value: { exception: any, message: string }) => {
            this.snackBar.open('Error: ' + value.message, 'Hide', {
                duration: 8000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
            });
        });

        // When a wallet is removed, we must update UI.
        this.communication.listen('account-removed', (value: any) => {
            if (this.uiState.hasAccounts) {
                this.router.navigateByUrl('/dashboard');
                // this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet?.activeAccountIndex);
            } else {
                this.router.navigateByUrl('/account/create');
            }
        });
    }

    setActiveWalletId(id: string) {
        this.communication.send('set-active-wallet-id', { id });
    }

    setActiveAccountId(index: number) {
        // Update local state as well.
        if (this.uiState.activeWallet) {
            this.uiState.activeWallet.activeAccountIndex = index;
        }

        this.communication.send('set-active-account', { index });
    }

    generateVaultConfiguration(domain: string) {
        this.communication.send('get-vault-configuration', { domain });
    }

    setSettings(settings: Settings) {
        this.communication.send('set-settings', settings);
    }

    updateIdentity(identity: Identity) {
        this.communication.send('identity-update', identity);
    }

    publishIdentity(identity: Identity) {
        this.communication.send('identity-publish', identity);
    }

    // setLockTimer(minutes: number) {
    //     this.communication.send('set-lock-timer', { minutes });
    // }

    updateAccount(id: string, index: number, fields: { name: string, icon?: string }) {
        this.communication.send('account-update', { id, index, fields });
    }

    // setAccountName(id: string, index: number, name: string) {
    //     this.communication.send('set-account-name', { id, index, name });
    // }

    // setAccountIcon(id: string, index: number, icon: string) {
    //     this.communication.send('set-account-icon', { id, index, icon });
    // }

    setWalletName(id: string, name: string) {
        this.communication.send('set-wallet-name', { id, name });
    }

    unlock(id: string, password: string) {
        this.communication.send('wallet-unlock', { id, password });
    }

    removeAccount(id: string, index: number) {
        this.communication.send('account-remove', { id, index });
    }

    lock(id: string) {
        this.communication.send('wallet-lock', { id });
    }

    setAction(action: Action) {
        this.communication.send('set-action', action);
    }

    clearAction() {
        this.communication.send('set-action', { action: '' });
    }

    createAccount(account: Account) {
        this.communication.send('account-create', account);
    }

    createVault(data: Vault) {
        this.communication.send('vault-publish', data);
    }

    sign(content?: string, tabId?: string) {
        this.communication.send('sign-content', { content, tabId });
    }
}
