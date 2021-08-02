import { Component, Inject, HostBinding } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common'
import { ApplicationState } from 'src/app/services/application-state.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['../account.component.css']
})
export class AccountEditComponent {

  walletName!: string;

  constructor(
    private router: Router,
    private location: Location,
    public appState: ApplicationState
  ) {
    this.appState.title = 'Edit Wallet'

    this.walletName = this.appState.activeAccount.name;
  }

  async save() {
    this.appState.activeAccount.name = this.walletName;
    await this.appState.save();
    // this.router.navigateByUrl('/home');
    this.location.back();
  }

  cancel() {
    this.location.back();
  }
}
