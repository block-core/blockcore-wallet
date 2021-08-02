import { Component, Inject, HostBinding } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common'
import { ApplicationState } from 'src/app/services/application-state.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['../account.component.css']
})
export class AccountEditComponent {

  accountName!: string;

  constructor(
    private router: Router,
    private location: Location,
    public appState: ApplicationState,
    private activatedRoute: ActivatedRoute,
  ) {
    this.appState.title = 'Edit Account'

    this.activatedRoute.paramMap.subscribe(async params => {

      console.log('PARAMS:', params);
      const index: any = params.get('index');
      console.log('Account Index:', Number(index));

      this.appState.persisted.activeAccountIndex = Number(index);
      this.accountName = this.appState.activeAccount.name;

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
    this.appState.activeAccount.name = this.accountName;
    await this.appState.save();
    // this.router.navigateByUrl('/home');
    this.location.back();
  }

  cancel() {
    this.location.back();
  }
}
