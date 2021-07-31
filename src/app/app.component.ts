import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { ApplicationState } from './services/application-state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'blockcore-extension';
  wallet: any;

  @ViewChild('drawer') drawer!: MatSidenav;

  constructor(public appState: ApplicationState,
    private router: Router) {

  }

  ngOnInit(): void {

  }

  lock() {
    // TODO: We also must remove the master key at this time, but we currently don't keep master key in-memory.
    this.appState.unlocked = false;
    this.drawer.close();
    this.router.navigateByUrl('/home');
  }

  async onAccountChanged(event: any) {
    const walletIndex = event.value;

    console.log(JSON.stringify(this.appState.persisted));

    this.drawer.close();

    if (walletIndex === -1) {
      this.router.navigateByUrl('/account');
    } else {
      console.log('walletIndex:', walletIndex);

      this.appState.persisted.activeAccountIndex = walletIndex;
      await this.appState.save();

      console.log(this.appState.persisted.activeAccountIndex);

      // Make sure we route to home to unlock the newly selected wallet.
      this.router.navigateByUrl('/home');
    }
  }
}
