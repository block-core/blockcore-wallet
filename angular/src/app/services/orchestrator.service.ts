// import { Injectable } from '@angular/core';
// import { Router } from '@angular/router';
// import { UIState } from './ui-state.service';
// import { CommunicationService } from './communication.service';
// import { Account, Action, Identity, NetworkStatus, Settings, State, Vault } from '../interfaces';
// import {
//     MatSnackBar,
//     MatSnackBarHorizontalPosition,
//     MatSnackBarVerticalPosition,
// } from '@angular/material/snack-bar';
// import { stringify } from 'querystring';
// import { NetworkStatusService } from './network-status.service';
// import { SecureStateService } from './secure-state.service';

// @Injectable({
//     providedIn: 'root'
// })
// export class OrchestratorService {
//     constructor(
//         private communication: CommunicationService,
//         private uiState: UIState,
//         private router: Router,
//         private networkStatus: NetworkStatusService,
//         private snackBar: MatSnackBar,
//         private secure: SecureStateService
//     ) {

//     }

//     initialize() {
//         console.log('OrchestratorService wiring up listeners.');
//         this.eventHandlers();
//     }

//     private eventHandlers() {
//         this.communication.listen('wallet-locked', () => this.router.navigateByUrl('/'));
//         // this.communication.listen('unlocked', () => this.uiState.unlocked = true);

//         // When an action is triggered from the content script / background.
//         this.communication.listen('action', (action: Action) => {
//             console.log('action', action);
//             this.uiState.action = action;
//         });

//         // When action has been reset, ensure that UI instances redirect to root.
//         this.communication.listen('action-changed', (action: Action) => {
//             debugger;
//             if (!action.action) {
//                 debugger;
//                 this.router.navigateByUrl('/');
//             }
//         });

//         // // When a wallet is removed, we must update UI.
//         // this.communication.listen('wallet-removed', (value: any) => {
//         //     // We'll always redirect to root when a wallet is removed.
//         //     this.router.navigateByUrl('/');

//         //     // this.uiState.persisted.wallets.splice(this.uiState.persisted.activeWalletIndex, 1);

//         //     // if (this.uiState.hasWallets) {
//         //     //   this.uiState.persisted.activeWalletIndex = 0;
//         //     // } else {
//         //     //   this.uiState.persisted.activeWalletIndex = -1;
//         //     // }

//         //     // await this.uiState.save();
//         // });

//         // When a wallet is removed, we must update UI.
//         this.communication.listen('error', (value: { exception: any, message: string }) => {
//             this.snackBar.open('Error: ' + value.message, 'Hide', {
//                 duration: 8000,
//                 horizontalPosition: 'center',
//                 verticalPosition: 'bottom',
//             });
//         });

//         // When a wallet is removed, we must update UI.
//         this.communication.listen('account-removed', (value: any) => {
//             if (this.uiState.hasAccounts) {
//                 this.router.navigateByUrl('/dashboard');
//                 // this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet?.activeAccountIndex);
//             } else {
//                 this.router.navigateByUrl('/account/create');
//             }
//         });

//         this.communication.listen('active-account-changed', (value: { walletId: string, accountId: string }) => {
//             console.log('active-account-changed!!', value);
//         });

//         this.communication.listen('active-wallet-changed', (value: { walletId: string }) => {
//             console.log('active-account-changed!!', value);
//         });
//     }

//     // setActiveWalletId(id: string) {
//     //     this.communication.send('set-active-wallet-id', { id });
//     // }

//     setActiveAccountId(identifier: string) {
//         // // Update local state as well.
//         // if (this.uiState.activeWallet) {
//         //     this.uiState.activeWallet.activeAccountId = identifier;
//         //     // this.uiState.activeWallet.activeAccountIndex
//         //     // this.uiState.activeWallet.activeAccountIndex = index;
//         // }

//         // Don't update local state yet, wait for this event to happen.
//         this.communication.send('set-active-account', { walletId: this.uiState.activeWallet.id, accountId: identifier });
//     }

//     generateVaultConfiguration(domain: string) {
//         this.communication.send('get-vault-configuration', { domain });
//     }

//     updateIdentity(identity: Identity) {
//         this.communication.send('identity-update', identity);
//     }

//     publishIdentity(identity: Identity) {
//         this.communication.send('identity-publish', identity);
//     }

//     // setWalletName(walletId: string, name: string) {
//     //     this.communication.send('set-wallet-name', { walletId, name });
//     // }

//     removeAccount(walletId: string, accountId: string) {
//         this.communication.send('account-remove', { walletId, accountId });
//     }

//     setAction(action: Action, broadcast = true) {
//         this.communication.send('set-action', { action, broadcast });
//     }

//     clearAction() {
//         this.communication.send('set-action', { action: { action: '' } });
//     }

//     // createAccount(walletId: string, account: Account) {
//     //     this.communication.send('account-create', { walletId, account });
//     // }

//     // createAccounts(walletId: string, accounts: Account[]) {
//     //     this.communication.send('accounts-create', { walletId, accounts });
//     // }

//     createVault(data: Vault) {
//         this.communication.send('vault-publish', data);
//     }

//     sign(content?: string, tabId?: string) {
//         this.communication.send('sign-content', { content, tabId, walletId: this.uiState.activeWallet.id, accountId: this.uiState.activeAccount.identifier });
//     }

//     signCallbackToUrl(content?: string, tabId?: string, callbackUrl?: string) {
//         this.communication.send('sign-content-and-callback-to-url', { content, tabId, callbackUrl, walletId: this.uiState.activeWallet.id, accountId: this.uiState.activeAccount.identifier });
//     }
// }
