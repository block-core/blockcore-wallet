import { Component, Inject, HostBinding, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../services/crypto.service';
import { ApplicationState } from '../services/application-state.service';
import { ActivatedRoute, Router } from '@angular/router';

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
    public appState: ApplicationState,
    private crypto: CryptoService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef) {

    this.appState.title = 'Account: ';

    if (!this.appState.hasAccounts) {
      this.router.navigateByUrl('/account/create');
    }

    this.activatedRoute.paramMap.subscribe(async params => {

      console.log('PARAMS:', params);
      const index: any = params.get('index');
      console.log('Account Index:', Number(index));

      this.appState.persisted.activeAccountIndex = Number(index);

      // Persist when changing accounts.
      this.appState.save();

      this.appState.title = 'Account: ' + this.appState.activeAccount?.name;
    });
  }
}
