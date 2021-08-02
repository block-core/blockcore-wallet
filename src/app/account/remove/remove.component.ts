import { Component, Inject, HostBinding } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
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
    public appState: ApplicationState,
    private activatedRoute: ActivatedRoute,
  ) {
    this.appState.title = 'Remove Account';

    this.activatedRoute.paramMap.subscribe(async params => {

      console.log('PARAMS:', params);
      const index: any = params.get('index');
      console.log('Account Index:', Number(index));

      const accountCount = this.appState.activeWallet?.accounts?.length;

      // Check if the index is available before allowing to change.
      if (index != -1 && accountCount != null && index < accountCount) {
        this.appState.persisted.activeAccountIndex = Number(index);
      }
      else {
        console.log('Attempting to show account that does not exists.');
        this.router.navigateByUrl('/account');
      }
    });
  }

  async wipe() {
    // Remove the active account from the array.
    this.appState.activeWallet?.accounts.splice(this.appState.persisted.activeAccountIndex, 1);

    if (this.appState.hasAccounts) {
      this.appState.persisted.activeAccountIndex = 0;
    } else {
      this.appState.persisted.activeAccountIndex = -1;
    }

    await this.appState.save();

    if (this.appState.hasAccounts) {
      this.router.navigateByUrl('/account/view/' + this.appState.persisted.activeAccountIndex);
    } else {
      this.router.navigateByUrl('/account/create');
    }

  }

  cancel() {
    this.location.back();
  }
}
