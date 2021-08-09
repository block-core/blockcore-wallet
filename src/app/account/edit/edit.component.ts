import { Component, Inject, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState } from 'src/app/services/ui-state.service';
import { OrchestratorService } from 'src/app/services/orchestrator.service';
import { CommunicationService } from 'src/app/services/communication.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['../account.component.css']
})
export class AccountEditComponent implements OnInit, OnDestroy {

  accountName: string | undefined;
  sub: any;

  constructor(
    private router: Router,
    private location: Location,
    public uiState: UIState,
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
    });
  }

  ngOnInit() {
    this.sub = this.communication.listen('account-name-set', () => {
      this.location.back();
    });
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
      this.manager.setAccountName(this.uiState.activeWallet.id, this.uiState.activeWallet.activeAccountIndex, this.accountName);
    }
  }

  cancel() {
    this.location.back();
  }
}
