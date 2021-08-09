import { Account, State, Wallet } from 'src/app/interfaces';
import { MINUTE } from 'src/app/shared/constants';
import { AppState } from './application-state';
import { CommunicationBackgroundService } from './communication';
import { CryptoUtility } from './crypto-utility';

export class OrchestratorBackgroundService {
    private communication!: CommunicationBackgroundService;
    private state!: AppState;
    private crypto!: CryptoUtility;
    timer: any;

    configure(communication: CommunicationBackgroundService, state: AppState, crypto: CryptoUtility) {
        this.communication = communication;
        this.state = state;
        this.crypto = crypto;
        this.eventHandlers();
        this.timeoutHandler();
    }

    timeoutHandler() {

    }

    active() {
        console.log('active:');
        this.resetTimer();
    }

    async onInactiveTimeout() {
        console.log('onInactiveTimeout:');

        this.state.passwords.clear();

        await this.state.save();
        this.refreshState();

        this.communication.sendToAll('wallet-locked');

        //this.unlocked = false;
        // console.log('redirect to root:');
        // Redirect to root and log user out of their wallet.
        // this.router.navigateByUrl('/');
    }

    resetTimer() {
        console.log('resetTimer:', this.state.persisted.autoTimeout * MINUTE);

        if (this.timer) {
            clearTimeout(this.timer);
        }

        // We will only set timer if the wallet is actually unlocked.
        if (this.state.passwords.size > 0) {
            console.log('Setting timer to automatically unlock.');
            this.timer = setTimeout(
                // () => this.ngZone.run(() => {
                () => {
                    this.onInactiveTimeout();
                },
                // }),
                this.state.persisted.autoTimeout * MINUTE
            );
        } else {
            console.log('Timer not set since wallet is not unlocked.');
        }
    }

    refreshState() {
        // Whenever we refresh the state, we'll also reset the timer. State changes should occur based on user-interaction.
        this.active();

        const initialState: State = {
            action: this.state.action,
            persisted: this.state.persisted,
            unlocked: this.state.unlocked
        }

        // Send new state to UI instances.
        this.communication.sendToAll('state', initialState);
    };

    async setAction(action: string) {
        this.state.action = action;

        if (typeof action !== 'string') {
            console.error('Only objects that are string are allowed as actions.');
            return;
        }

        await this.state.saveAction();

        this.refreshState();

        // Raise this after state has been updated, so orchestrator in UI can redirect correctly.
        this.communication.sendToAll('action-changed', this.state.action);
    }

    private eventHandlers() {
        // "state" is the first request from the UI.
        this.communication.listen('state', async (port: any, data: any) => {
            // If the local state has not yet initialized, we'll log error. This should normally not happen
            // and we have a race-condition that should be mitigated differently.
            if (!this.state.initialized) {
                console.error('State was requested before initialized. This is a race-condition that should not occurr.');
                return;
            }

            // TODO: Add support for persisting wallet/account connected to domain.
            const url = data.url;
            console.log('Getting last state for: ', url);

            const initialState: State = {
                action: this.state.action,
                persisted: this.state.persisted,
                unlocked: this.state.unlocked
            };

            this.communication.send(port, 'state', initialState);
        });

        // this.communication.listen('getlock', (port: any, data: any) => {
        //     if (this.state.password) {
        //         this.communication.send(port, 'getlock', true);
        //     } else {
        //         this.communication.send(port, 'getlock', false);
        //     }
        // });

        this.communication.listen('timer-reset', (port: any, data: any) => {
            this.active();
        });

        this.communication.listen('set-action', async (port: any, data: { action: string }) => {
            this.setAction('');
        });

        this.communication.listen('set-active-wallet-id', async (port: any, data: any) => {
            this.state.persisted.activeWalletId = data.id;
            await this.state.save();
            this.refreshState();
        });

        this.communication.listen('set-lock-timer', async (port: any, data: any) => {
            this.state.persisted.autoTimeout = data.minutes;
            await this.state.save();
            this.refreshState();
        });

        this.communication.listen('account-update', async (port: any, data: { id: string, index: number, fields: { name: string, icon: string } }) => {
            const wallet = this.state.persisted.wallets.find(w => w.id == data.id);

            if (!wallet) {
                return;
            }

            const account = wallet.accounts[data.index];
            account.name = data.fields.name;
            account.icon = data.fields.icon;

            await this.state.save();
            this.refreshState();

            this.communication.send(port, 'account-updated');
        });

        // this.communication.listen('set-account-icon', async (port: any, data: { id: string, index: number, icon: string }) => {
        //     const wallet = this.state.persisted.wallets.find(w => w.id == data.id);

        //     if (!wallet) {
        //         return;
        //     }

        //     const account = wallet.accounts[data.index];
        //     account.icon = data.icon;

        //     await this.state.save();
        //     this.refreshState();

        //     this.communication.send(port, 'account-icon-set');
        // });

        this.communication.listen('set-wallet-name', async (port: any, data: { id: string, name: string }) => {
            const wallet = this.state.persisted.wallets.find(w => w.id == data.id);

            if (!wallet) {
                return;
            }

            wallet.name = data.name;
            await this.state.save();
            this.refreshState();
        });

        this.communication.listen('account-remove', async (port: any, data: { id: string, index: number }) => {
            const wallet = this.state.persisted.wallets.find(w => w.id == data.id);

            if (!wallet) {
                return;
            }

            // Remove the active account from the array.
            wallet.accounts.splice(data.index, 1);

            if (wallet.accounts.length > 0) {
                wallet.activeAccountIndex = 0;
            } else {
                wallet.activeAccountIndex = -1;
            }

            await this.state.save();
            this.refreshState();

            // Raise this after state has been updated, so orchestrator in UI can redirect correctly.
            this.communication.sendToAll('account-removed', data);
        });

        this.communication.listen('wallet-remove', async (port: any, data: { id: string, index: number }) => {
            const walletIndex = this.state.persisted.wallets.findIndex(w => w.id == data.id);

            // Remove the wallet.
            this.state.persisted.wallets.splice(walletIndex, 1);

            // Remove the password for this wallet, if it was unlocked.
            this.state.passwords.delete(data.id);

            await this.state.save();
            this.refreshState();

            // Raise this after state has been updated, so orchestrator in UI can redirect correctly.
            this.communication.sendToAll('wallet-removed', data);
        });

        this.communication.listen('wallet-lock', async (port: any, data: { id: string }) => {

            this.state.passwords.delete(data.id);

            this.refreshState();

            // Make sure we inform all instances when a wallet is unlocked.
            this.communication.sendToAll('wallet-locked');
        });

        this.communication.listen('wallet-unlock', async (port: any, data: { id: string, password: string }) => {
            var wallet = this.state.persisted.wallets.find(w => w.id == data.id);

            if (!wallet) {
                return;
            }

            let unlockedMnemonic = null;
            unlockedMnemonic = await this.crypto.decryptData(wallet.mnemonic, data.password);

            if (unlockedMnemonic) {
                this.state.persisted.activeWalletId = wallet.id;

                // Add this wallet to list of unlocked.
                this.state.passwords.set(data.id, data.password);

                // if (wallet.accounts.length > 0 && wallet.activeAccountIndex == null) {
                //     wallet.activeAccountIndex = 0;
                // }

                // if (this.state.persisted.activeAccountIndex

                // this.uiState.unlocked = true;

                // if (this.uiState.persisted.activeAccountIndex == null) {
                //     this.uiState.persisted.activeAccountIndex = 0;
                // }

                // // Keep the unlocked mnemonic in-memory until auto-lock timer removes it.
                // this.uiState.unlockedMnemonic = unlockedMnemonic;

                // this.uiState.port?.postMessage({ method: 'unlock', data: this.unlockPassword });

                // this.router.navigateByUrl('/account/view/' + this.uiState.persisted.activeAccountIndex);

                // Add the new wallet.
                // this.state.persisted.wallets.set(data.id, data);

                // Change the active wallet to the new one.
                // this.state.persisted.activeWalletId = data.id;

                // Persist the state.
                await this.state.save();

                this.refreshState();

                // Make sure we inform all instances when a wallet is unlocked.
                this.communication.sendToAll('wallet-unlocked');

            } else {
                this.communication.send(port, 'error', { exception: null, message: 'Invalid password' });
                // this.error = 'Invalid password';
            }
        });

        this.communication.listen('account-create', async (port: any, data: Account) => {
            if (!this.state.activeWallet) {
                return;
            }

            // Add the new account.
            this.state.activeWallet.accounts.push(data);

            this.state.activeWallet.activeAccountIndex = (this.state.activeWallet.accounts.length - 1);

            await this.state.save();

            this.refreshState();

            this.communication.sendToAll('account-created');
        });

        this.communication.listen('set-active-account', async (port: any, data: { index: number }) => {
            if (!this.state.activeWallet) {
                console.log('No active wallet on set-active-account.');
                return;
            }

            this.state.activeWallet.activeAccountIndex = data.index;

            await this.state.save();

            this.refreshState();

            this.communication.sendToAll('active-account-changed', { index: data.index });
        });

        this.communication.listen('wallet-create', async (port: any, data: Wallet) => {
            // Add the new wallet.
            // TODO: Do we first want to validate if the wallet is not already added with same ID?
            // If so... we must ensure that mnemonics are not different, or a call might wipe existing wallet.
            this.state.persisted.wallets.push(data);

            // Change the active wallet to the new one.
            this.state.persisted.activeWalletId = data.id;

            // Persist the state.
            await this.state.save();

            this.refreshState();

            // Make sure we inform all instances when a wallet is deleted.
            this.communication.sendToAll('wallet-created');
        });

        this.communication.listen('wallet-delete', async (port: any, data: any) => {
            const walletId = data.id;

            // Remove the wallet.
            this.state.persisted.wallets.splice(this.state.persisted.wallets.findIndex(w => w.id == walletId), 1);

            // Remove the password, if wallet was unlocked.
            this.state.passwords.delete(walletId);

            if (!this.state.hasWallets) {
                this.state.persisted.activeWalletId = null;
            } else {
                // Select the first key as active wallet.
                this.state.persisted.activeWalletId = this.state.persisted.wallets[0].id;
                // const keys = Array.from(this.state.persisted.wallets.keys());
                // this.state.persisted.activeWalletId = keys[0];
            }

            await this.state.save();

            // Make sure we inform all instances when a wallet is deleted.
            this.communication.sendToAll('wallet-deleted');

            this.refreshState();
        });
    }
}
