import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../../../services/crypto.service';
import { UIState } from '../../../services/ui-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OrchestratorService } from '../../../services/orchestrator.service';
import { CommunicationService } from '../../../services/communication.service';

@Component({
  selector: 'app-account-identity',
  templateUrl: './identity.component.html',
  styleUrls: ['./identity.component.css']
})
export class AccountIdentityComponent implements OnInit, OnDestroy {
  mnemonic = '';
  password = '';
  unlocked = '';
  unlockPassword = '';
  alarmName = 'refresh';
  wallet: any;
  account!: any;
  sub: any;
  previousIndex!: number;
  identity: any;

  constructor(
    public uiState: UIState,
    private crypto: CryptoService,
    private router: Router,
    private manager: OrchestratorService,
    private communication: CommunicationService,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef) {

    this.uiState.title = 'Account: ';
    this.uiState.showBackButton = true;

    if (!this.uiState.hasAccounts) {
      this.router.navigateByUrl('/account/create');
    }

    this.activatedRoute.paramMap.subscribe(async params => {
      debugger;
      // If we are currently viewing an account and the user changes, we'll refresh this view.
      // if (this.previousIndex != data.index) {
      //   this.router.navigate(['account', 'view', data.index]);
      // }

      // console.log('PARAMS:', params);
      // const index: any = params.get('index');
      // const index = data.index;

      // console.log('Index to view:', index);

      // if (!this.uiState.activeWallet) {
      //   return;
      // }

      // this.manager.setActiveAccountId(index);
      this.uiState.title = 'Account: ' + this.uiState.activeAccount?.name;

      // this.uiState.persisted.activeAccountIndex = Number(index);

      // Persist when changing accounts.
      // this.uiState.save();

      // this.previousIndex = index;

      var did = this.uiState.activeAccount?.identifier;
      this.identity = this.uiState.store.identities.find(i => i.id == did);

    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.communication.unlisten(this.sub);
    }
  }

  ngOnInit(): void {
    this.sub = this.communication.listen('active-account-changed', (data: any) => {
      debugger;
      // If we are currently viewing an account and the user changes, we'll refresh this view.
      // if (this.previousIndex != data.index) {
      //   this.router.navigate(['account', 'view', data.index]);
      // }

      // console.log('PARAMS:', params);
      // const index: any = params.get('index');
      const index = data.index;

      console.log('Index to view:', index);

      if (!this.uiState.activeWallet) {
        return;
      }

      // this.manager.setActiveAccountId(index);
      this.uiState.title = 'Account: ' + this.uiState.activeAccount?.name;

      // this.uiState.persisted.activeAccountIndex = Number(index);

      // Persist when changing accounts.
      // this.uiState.save();

      this.previousIndex = index;

      var did = this.uiState.activeAccount?.identifier;
      this.identity = this.uiState.store.identities.find(i => i.id == did);

    });
  }
}
