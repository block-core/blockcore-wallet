import { Component, Inject, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState } from 'src/app/services/ui-state.service';
import { OrchestratorService } from 'src/app/services/orchestrator.service';
import { CommunicationService } from 'src/app/services/communication.service';
import { IconService } from 'src/app/services/icon.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['../account.component.css']
})
export class AccountEditComponent implements OnInit, OnDestroy {

  accountName: string | undefined;
  sub: any;
  icon: string | undefined;

  constructor(
    private router: Router,
    private location: Location,
    public uiState: UIState,
    public icons: IconService,
    private manager: OrchestratorService,
    private communication: CommunicationService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.uiState.title = 'Edit Account'

    this.activatedRoute.paramMap.subscribe(async params => {
      const index: any = params.get('index');

      if (!this.uiState.activeWallet) {
        return;
      }

      this.manager.setActiveAccountId(index);
      this.accountName = this.uiState.activeAccount?.name;
      this.icon = this.uiState.activeAccount?.icon;
    });
  }

  ngOnInit() {
    this.sub = this.communication.listen('account-updated', () => {
      this.location.back();
    });
  }

  changeIcon(icon: string) {
    if (this.uiState.activeAccount) {
      this.uiState.activeAccount.icon = icon;
    }
  }

  ngOnDestroy(): void {
    this.communication.unlisten(this.sub);
  }

  async save() {
    if (!this.uiState.activeWallet) {
      this.location.back();
      return;
    }

    // We won't allow empty names for accounts.
    if (this.accountName) {
      this.manager.updateAccount(this.uiState.activeWallet.id, this.uiState.activeWallet.activeAccountIndex, { name: this.accountName, icon: this.icon });
    }
  }

  cancel() {
    this.location.back();
  }
}
