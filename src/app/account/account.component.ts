import { Component, Inject, HostBinding, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../services/crypto.service';
import { UIState } from '../services/ui-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OrchestratorService } from '../services/orchestrator.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html'
})
export class AccountComponent {
  mnemonic = '';
  password = '';
  unlocked = '';
  unlockPassword = '';
  alarmName = 'refresh';
  wallet: any;
  account!: any;

  constructor(
    public uiState: UIState,
    private crypto: CryptoService,
    private router: Router,
    private manager: OrchestratorService,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef) {

    this.uiState.title = 'Account: ';

    if (!this.uiState.hasAccounts) {
      this.router.navigateByUrl('/account/create');
    }

    this.activatedRoute.paramMap.subscribe(async params => {
      console.log('PARAMS:', params);
      const index: any = params.get('index');
      // console.log('Account Index:', Number(index));

      console.log('Index to view:', index);

      if (!this.uiState.activeWallet) {
        return;
      }

      this.manager.setActiveAccountId(index);
      this.uiState.title = 'Account: ' + this.uiState.activeAccount?.name;

      // this.uiState.persisted.activeAccountIndex = Number(index);

      // Persist when changing accounts.
      // this.uiState.save();

    });
  }
}
