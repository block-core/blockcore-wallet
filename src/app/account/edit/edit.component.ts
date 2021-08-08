import { Component, Inject, HostBinding } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState } from 'src/app/services/ui-state.service';
import { OrchestratorService } from 'src/app/services/orchestrator.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['../account.component.css']
})
export class AccountEditComponent {

  accountName: string | undefined;

  constructor(
    private router: Router,
    private location: Location,
    public uiState: UIState,
    private manager: OrchestratorService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.uiState.title = 'Edit Account'

    this.activatedRoute.paramMap.subscribe(async params => {

      console.log('PARAMS:', params);
      const index: any = params.get('index');
      console.log('Account Index:', Number(index));

      if (!this.uiState.activeWallet) {
        return;
      }

      this.manager.setActiveAccountId(this.uiState.activeWallet.id, index);

      // this.uiState.persisted.activeAccountIndex = Number(index);
      // this.accountName = this.uiState.activeAccount?.name;

      // const id: any = params.get('address');
      // console.log('Address:', id);

      // this.transactions = null;
      // this.address = id;
      // this.balance = await this.api.getAddress(id);
      // console.log(this.balance);

      // await this.updateTransactions('/api/query/address/' + id + '/transactions?limit=' + this.limit);
    });
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

    this.location.back();
  }

  cancel() {
    this.location.back();
  }
}
