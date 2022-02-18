import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CryptoService } from '../services/crypto.service';
import { UIState } from '../services/ui-state.service';
import { Router } from '@angular/router';
import { OrchestratorService } from '../services/orchestrator.service';
import { CommunicationService } from '../services/communication.service';
import { NetworkStatusService } from '../services/network-status.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  mnemonic = '';
  password = '';
  unlocked = '';
  unlockPassword = '';
  alarmName = 'refresh';
  wallet: any;
  error = '';
  sub: any;
  sub2: any;

  constructor(
    public uiState: UIState,
    private crypto: CryptoService,
    private router: Router,
    private communication: CommunicationService,
    private manager: OrchestratorService,
    private cd: ChangeDetectorRef) {

    // this.uiState.title = 'Unlock wallet';
    this.activateAlarm();

    // When on home page and when unlocked, open account.
    this.sub = this.communication.listen('wallet-unlocked', () => {
      if (this.uiState.action?.action) {
        this.router.navigate(['action', this.uiState.action.action]);
      } else {
        // If user has zero accounts, we'll show the account select screen that will auto-create accounts the user chooses.
        if (this.uiState.hasAccounts) {
          this.router.navigateByUrl('/dashboard');
          //this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet.activeAccountIndex);
        } else {
          this.router.navigateByUrl('/account/select');
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.communication.unlisten(this.sub);
    }

    if (this.sub2) {
      this.sub2.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.uiState.activeWallet$.subscribe((wallet => {
      if (this.uiState.activeWallet) {
        this.uiState.title = `Unlock ${this.uiState.activeWallet.name}`;
      }
    }));

    // Verify if the wallet is already unlocked.
    if (this.uiState.activeWallet) {
      this.uiState.title = `Unlock ${this.uiState.activeWallet.name}`;

      if (this.uiState.unlocked.findIndex(id => id == this.uiState.activeWallet?.id) > -1) {
        this.router.navigateByUrl('/dashboard');
        // this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet?.activeAccountIndex);
      }
    }
  }

  removeError(): void {
    this.error = '';
  }

  activateAlarm() {
    // TODO: Alarm is not needed as long as we use Manifest v2.
    // chrome.alarms.getAll((alarms) => {
    //   var hasAlarm = alarms.some((a) => {
    //     return a.name == this.alarmName;
    //   });

    //   if (!hasAlarm) {
    //     chrome.alarms.create('refresh', {
    //       delayInMinutes: 0.1, periodInMinutes: 0.1
    //     });

    //     console.log('Created alarm.');
    //   }
    //   else {
    //     console.log('Has alarm already!!');
    //   }
    // })
  }

  generate() {
    this.mnemonic = this.crypto.generateMnemonic();
  }

  async unlock() {
    if (this.uiState.activeWallet) {
      this.manager.unlock(this.uiState.activeWallet.id, this.unlockPassword);
    }
  }
}
