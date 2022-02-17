import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UIState } from './ui-state.service';
import { CommunicationService } from './communication.service';
import { Account, Action, Identity, NetworkStatus, Settings, State, Vault } from '../interfaces';
import {
    MatSnackBar,
    MatSnackBarHorizontalPosition,
    MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { stringify } from 'querystring';
import { NetworkStatusService } from './network-status.service';

@Injectable({
    providedIn: 'root'
})
export class OrchestratorService {
    constructor(
        private communication: CommunicationService,
        private uiState: UIState,
        private router: Router,
        private networkStatus: NetworkStatusService,
        private snackBar: MatSnackBar
    ) {

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

            console.log('EVENT: state-loaded', state);
            this.uiState.initialized = true;
            this.uiState.action = state.action;
            this.uiState.persisted = state.persisted;
            this.uiState.store = state.store;
            this.uiState.unlocked = state.unlocked;

            this.uiState.persisted$.next(this.uiState.persisted);
            this.uiState.activeWalletSubject.next(this.uiState.activeWallet);
            this.uiState.activeAccountSubject.next(this.uiState.activeAccount);

            // If there is any params, it means there might be an action triggered by protocol handlers. Parse the params and set action.
            if (this.uiState.params) {
                if (this.uiState.params.sid) {
                    this.uiState.action = {
                        action: 'sid',
                        document: this.uiState.params.sid
                    }

                    setTimeout(() => {
                        // Persist the action, but don't broadcast this change as we've already written local state.
                        this.setAction(this.uiState.action, true);
                    }, 0);
                }
            }

            console.log('ACTION:', this.uiState.action);

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

                        // If user has zero accounts, we'll show the account select screen that will auto-create accounts the user chooses.
                        if (this.uiState.hasAccounts) {
                            this.router.navigateByUrl('/dashboard');
                            //this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet.activeAccountIndex);
                        } else {
                            this.router.navigateByUrl('/account/select');
                        }

                    } else {
                        // When the initial state is loaded and user has not unlocked any wallets, we'll show the unlock screen on home.
                        console.log('LOADING REDIRECT TO HOME');
                        this.router.navigateByUrl('/home');
                    }
                }
            }

            // After the initial state has been loaded into the new UI instance, we'll inform the background that new UI has activated.
            this.communication.send('ui-activated');
        });

        // Whenever the state is updated, we'll update in the UI.
        this.communication.listen('state-changed', (state: State) => {
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
            debugger;
            if (!action.action) {
                debugger;
                this.router.navigateByUrl('/');
            }
        });

        this.communication.listen('network-status', (networkStatus: NetworkStatus) => {
            this.networkStatus.set(networkStatus);
        });

        this.communication.listen('network-statuses', (networkStatuses: NetworkStatus[]) => {
            networkStatuses.forEach((status) => {
                this.networkStatus.set(status);
            });
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

        this.communication.listen('active-account-changed', (value: { walletId: string, accountId: string }) => {
            console.log('active-account-changed!!', value);
        });

        this.communication.listen('active-wallet-changed', (value: { walletId: string }) => {
            console.log('active-account-changed!!', value);
        });
    }

    setActiveWalletId(id: string) {
        this.communication.send('set-active-wallet-id', { id });
    }

    setActiveAccountId(identifier: string) {
        // // Update local state as well.
        // if (this.uiState.activeWallet) {
        //     this.uiState.activeWallet.activeAccountId = identifier;
        //     // this.uiState.activeWallet.activeAccountIndex
        //     // this.uiState.activeWallet.activeAccountIndex = index;
        // }

        // Don't update local state yet, wait for this event to happen.
        this.communication.send('set-active-account', { walletId: this.uiState.activeWallet.id, accountId: identifier });
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

    updateAccount(walletId: string, accountId: string, fields: { name: string, icon?: string }) {
        this.communication.send('account-update', { walletId, accountId, fields });
    }

    setWalletName(walletId: string, name: string) {
        this.communication.send('set-wallet-name', { walletId, name });
    }

    unlock(walletId: string, password: string) {
        this.communication.send('wallet-unlock', { walletId, password, hideFromLog: true });
    }

    removeAccount(walletId: string, accountId: string) {
        this.communication.send('account-remove', { walletId, accountId });
    }

    lock(walletId: string) {
        this.communication.send('wallet-lock', { walletId });
    }

    setAction(action: Action, broadcast = true) {
        this.communication.send('set-action', { action, broadcast });
    }

    clearAction() {
        this.communication.send('set-action', { action: { action: '' } });
    }

    createAccount(walletId: string, account: Account) {
        this.communication.send('account-create', { walletId, account });
    }

    createAccounts(walletId: string, accounts: Account[]) {
        this.communication.send('accounts-create', { walletId, accounts });
    }

    createVault(data: Vault) {
        this.communication.send('vault-publish', data);
    }

    sign(content?: string, tabId?: string) {
        this.communication.send('sign-content', { content, tabId, walletId: this.uiState.activeWallet.id, accountId: this.uiState.activeAccount.identifier });
    }

    signCallbackToUrl(content?: string, tabId?: string, callbackUrl?: string) {
        this.communication.send('sign-content-and-callback-to-url', { content, tabId, callbackUrl, walletId: this.uiState.activeWallet.id, accountId: this.uiState.activeAccount.identifier });
    }
}
