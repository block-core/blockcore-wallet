import { Component, Inject, HostBinding } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common'
import { ApplicationState } from 'src/app/services/application-state.service';

@Component({
  selector: 'app-remove',
  templateUrl: './remove.component.html',
  styleUrls: ['../account.component.css']
})
export class AccountRemoveComponent {
  constructor(
    private router: Router,
    private location: Location,
    public appState: ApplicationState
  ) { }

  async wipe() {
    debugger;
    // Remove the active account from the array.
    this.appState.persisted.accounts.splice(this.appState.persisted.activeAccountIndex, 1);

    if (this.appState.hasAccounts) {
      this.appState.persisted.activeAccountIndex = 0;
    } else {
      this.appState.persisted.activeAccountIndex = -1;
    }

    await this.appState.save();

    if (this.appState.hasAccounts) {
      this.router.navigateByUrl('/home');
    } else {
      this.router.navigateByUrl('/account');
    }

  }

  cancel() {
    this.location.back();
  }
}
