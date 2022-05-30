import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { WalletManager, NetworksService, UIState, CommunicationService, NetworkStatusService } from '../../services';
import { Account } from '../../../shared/interfaces';

@Component({
    selector: 'app-account-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.css']
})
export class AccountSelectComponent implements OnInit, OnDestroy {

    coins: Account[];
    other: Account[];
    sub: any;
    creating = false;

    constructor(
        private uiState: UIState,
        private networkService: NetworksService,
        public walletManager: WalletManager,
        private communication: CommunicationService,
        private networkStatus: NetworkStatusService,
        private router: Router
    ) {
        uiState.title = 'Select accounts';
        uiState.showBackButton = true;
    }

    ngOnInit(): void {
        // Get the default accounts for the current wallet:
        const accounts = this.networkService.getDefaultAccounts();

        this.coins = accounts.filter(item => item.type === 'coin' || item.type === 'token');
        this.other = accounts.filter(item => item.type === 'other');

        // this.sub = this.communication.listen('account-created', () => {
        //     this.router.navigateByUrl('/dashboard');
        // });
    }

    ngOnDestroy(): void {
        // if (this.sub) {
        //     this.communication.unlisten(this.sub);
        // }
    }

    async create() {
        this.creating = true;

        const accounts = this.coins.filter(item => item.selected)
        accounts.push(...this.other.filter(item => item.selected));

        const wallet = this.walletManager.activeWallet;

        for (const account of accounts) {
            // Don't persist the selected value.
            delete account.selected;
            await this.walletManager.addAccount(account, wallet, false); // Hold off indexing while we save all accounts.
        }

        // Get latest status on all networks immediately.
        // UPDATE: Status is now updated earlier than this and we don't want the UI to wait.
        // await this.networkStatus.updateAll(accounts);

        if (wallet.restored) {
            const msg = this.communication.createMessage('index', { force: true }, 'background');
            this.communication.send(msg);
        } else {
            const msg = this.communication.createMessage('index', { force: false }, 'background');
            this.communication.send(msg);
        }

        // this.refreshState();
        this.router.navigateByUrl('/dashboard');

        this.creating = false;
        // TODO: Refresh all instances when new accounts is created.
        // this.communication.sendToAll('account-created');
    }
}
