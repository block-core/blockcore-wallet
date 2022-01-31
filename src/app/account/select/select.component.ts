import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Account } from '../../interfaces';
import { CommunicationService } from '../../services/communication.service';
import { NetworksService } from '../../services/networks.service';
import { OrchestratorService } from '../../services/orchestrator.service';
import { UIState } from '../../services/ui-state.service';

@Component({
    selector: 'app-account-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.css']
})
export class AccountSelectComponent implements OnInit, OnDestroy {

    coins: Account[];
    other: Account[];
    sub: any;

    constructor(
        private uiState: UIState,
        private networkService: NetworksService,
        private orchestrator: OrchestratorService,
        private communication: CommunicationService,
        private router: Router
    ) {
        uiState.title = 'Select accounts';
        uiState.showBackButton = true;
    }

    ngOnInit(): void {
        // Get the default accounts for the current wallet:
        const accounts = this.networkService.getDefaultAccounts(this.uiState.activeWallet);

        this.coins = accounts.filter(item => item.type === 'coin' || item.type === 'token');
        this.other = accounts.filter(item => item.type === 'other');

        this.sub = this.communication.listen('account-created', () => {
            this.router.navigateByUrl('/dashboard');
        });
    }

    ngOnDestroy(): void {
        this.communication.unlisten(this.sub);
    }

    create() {
        const accounts = this.coins.filter(item => item.selected)
        accounts.push(...this.other.filter(item => item.selected));

        this.orchestrator.createAccounts(this.uiState.activeWallet.id, accounts);
    }
}