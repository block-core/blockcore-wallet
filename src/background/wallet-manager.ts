import { Account, Settings } from "../app/interfaces";
import { MINUTE } from "../app/shared/constants";
import { AppManager } from "./application-manager";

/** Manager that keeps state and operations for a single wallet. This object does not keep the password, which must be supplied for signing operations. */
export class WalletManager {
    // addresses: AccountAddress[] = [];
    private lastUsedIndex: number = 0;
    private timer: any;

    constructor(private manager: AppManager) {
        // bip32.fromBase58(xpub).derive(0).derive(1).publicKey;

    }

    getWallets() {
        return this.manager.state.persisted.wallets;
    }

    lockWallets() {
        this.manager.state.passwords.clear();

        // Do we need to save the state and refresh? VERIFY!
        // await this.state.save();
        // this.refreshState();

        this.manager.communication.sendToAll('wallet-locked');
    }

    lockWallet(id: string) {
        this.manager.state.passwords.delete(id);
        this.manager.broadcastState();
    }

    async revealSecretRecoveryPhrase(id: string, password: string) {
        var wallet = this.manager.walletManager.getWallet(id);

        if (!wallet) {
            return;
        }

        let unlockedMnemonic = null;
        unlockedMnemonic = await this.manager.crypto.decryptData(wallet.mnemonic, password);

        return unlockedMnemonic;
    }

    async unlockWallet(id: string, password: string) {
        var wallet = this.manager.walletManager.getWallet(id);

        if (!wallet) {
            return;
        }

        let unlockedMnemonic = null;
        unlockedMnemonic = await this.manager.crypto.decryptData(wallet.mnemonic, password);

        if (unlockedMnemonic) {
            this.manager.state.persisted.activeWalletId = wallet.id;

            // Add this wallet to list of unlocked.
            this.manager.state.passwords.set(id, password);

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

            // TODO: VERIFY IF WE SHOULD SAVE STATE WHEN UNLOCKING?
            // Persist the state.
            //await this.manager.state.save();

            // this.refreshState();

            // Make sure we inform all instances when a wallet is unlocked.
            return true;

        } else {
            return false;
        }
    }

    resetTimer() {
        console.log('resetTimer:', this.manager.state.persisted.settings.autoTimeout * MINUTE);

        if (this.timer) {
            clearTimeout(this.timer);
        }

        // We will only set timer if the wallet is actually unlocked.
        if (this.manager.state.passwords.size > 0) {
            console.log('Setting timer to automatically unlock.');
            this.timer = setTimeout(
                () => {
                    this.lockWallets();
                },
                this.manager.state.persisted.settings.autoTimeout * MINUTE
            );
        } else {
            console.log('Timer not set since wallet is not unlocked.');
        }
    }

    get hasWallets(): boolean {
        return this.manager.state.persisted.wallets.length > 0;
    }

    get activeWallet() {
        if (this.manager.state.persisted.activeWalletId) {
            return this.manager.state.persisted.wallets.find(w => w.id == this.manager.state.persisted.activeWalletId);
            // return this.persisted.wallets.get(this.persisted.activeWalletId);
            // return this.persisted.wallets[this.persisted.activeWalletIndex];
        } else {
            return undefined;
        }
    }

    get hasAccounts(): boolean {
        if (!this.activeWallet) {
            return false;
        }

        return this.activeWallet.accounts?.length > 0;
    }

    get activeAccount() {
        if (!this.activeWallet) {
            return null;
        }

        const activeWallet = this.activeWallet;

        if (!activeWallet.accounts) {
            return null;
        }

        if (activeWallet.activeAccountIndex == null || activeWallet.activeAccountIndex == -1) {
            activeWallet.activeAccountIndex = 0;
        }
        // If the active index is higher than available accounts, reset to zero.
        else if (activeWallet.activeAccountIndex >= activeWallet.accounts.length) {
            activeWallet.activeAccountIndex = 0;
        }

        return this.activeWallet.accounts[activeWallet.activeAccountIndex];
    }

    isActiveWalletUnlocked(): boolean {
        let password = this.manager.state.passwords.get(this.activeWallet.id);

        if (password === null || password === undefined || password === '') {
            return false;
        } else {
            return true;
        }
    }

    async setActiveWallet(id: string) {
        this.manager.state.persisted.activeWalletId = id;
        await this.manager.state.save();
        this.manager.broadcastState();
    }

    getWallet(id: string) {
        const wallet = this.manager.state.persisted.wallets.find(w => w.id == id);
        return wallet;
    }

    async removeWallet(id: string) {
        const walletIndex = this.manager.state.persisted.wallets.findIndex(w => w.id == id);

        // Remove the wallet.
        this.manager.state.persisted.wallets.splice(walletIndex, 1);

        // Remove the password for this wallet, if it was unlocked.
        this.manager.state.passwords.delete(id);

        await this.manager.state.save();

        this.manager.broadcastState();
    }

    getAddress(account: Account, index: BigInt) {

        // Get the network for this account. Maybe this operation should be done once upon initialize? Consider refactoring.
        const network = this.manager.getNetwork(account.network, account.purpose);

        

        this.manager.state.networks.

        this.manager.crypto.getAddress()

        bip32.fromBase58(xpub).derive(0).derive(1).publicKey;

        account.xpub.

    }

    getReceiveAddress(account: Account) {
        // Get the last index without know transactions:
        let address = account.state.addresses[account.state.addresses.length - 1];

        if (address.totalReceivedCount > 0n) {
            // Generate a new address.



        }

        return address.address;
    }
}
