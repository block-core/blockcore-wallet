import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Account } from '../../interfaces';
import { NetworksService } from '../../services/networks.service';
import { UIState } from '../../services/ui-state.service';

@Component({
    selector: 'app-account-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.css']
})
export class AccountSelectComponent implements OnInit, OnDestroy {

    coins: Account[];
    other: Account[];

    constructor(
        private uiState: UIState,
        private networkService: NetworksService
    ) {
        uiState.title = 'Select accounts';
        uiState.showBackButton = true;
    }

    ngOnInit(): void {
        // Get the default accounts for the current wallet:
        const accounts = this.networkService.getDefaultAccounts(this.uiState.activeWallet);

        this.coins = accounts.filter(item => item.type === 'coin' || item.type === 'token');
        this.other = accounts.filter(item => item.type === 'other');
    }

    ngOnDestroy(): void {

    }
}