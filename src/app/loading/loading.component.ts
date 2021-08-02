import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApplicationState } from '../services/application-state.service';
import { CryptoService } from '../services/crypto.service';
import { Router } from '@angular/router';
import { Persisted } from '../interfaces';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html'
})
export class LoadingComponent implements OnInit {
  constructor(
    public appState: ApplicationState,
    private crypto: CryptoService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {
  }

  async ngOnInit() {
    // Perform the initial load of the application state.
    var state = await this.appState.load();

    if (state) {
      this.appState.persisted = state as Persisted;
    }

    this.appState.loading = false;

    // Select the previous selected account.
    // if (this.appState.hasWallets) {
    //   this.appState.activeWallet = this.appState.persisted.wallets[0];
    // }

    console.log(JSON.stringify(this.appState));

    console.log('redirect...');

    if (!this.appState.hasWallets) {
      this.router.navigateByUrl('/wallet/create');
    }
    else {
      this.router.navigateByUrl('/home');
    }
  }
}
