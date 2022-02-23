import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CryptoService, UIState } from '../services';
import { Router } from '@angular/router';
import { CommunicationService, NetworkStatusService, SecureStateService, WalletManager } from '../services';

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
    private secure: SecureStateService,
    public walletManager: WalletManager,
    private cd: ChangeDetectorRef) {

    this.uiState.title = 'Unlock wallet';
    this.activateAlarm();

    // When on home page and when unlocked, open account.
    // this.sub = this.communication.listen('wallet-unlocked', () => {
    //   if (this.uiState.action?.action) {
    //     this.router.navigate(['action', this.uiState.action.action]);
    //   } else {
    //     // If user has zero accounts, we'll show the account select screen that will auto-create accounts the user chooses.
    //     if (this.uiState.hasAccounts) {
    //       this.router.navigateByUrl('/dashboard');
    //       //this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet.activeAccountIndex);
    //     } else {
    //       this.router.navigateByUrl('/account/select');
    //     }
    //   }
    // });
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
    // this.walletManager.activeWallet$.subscribe((wallet => {
    //   if (this.walletManager.activeWallet) {
    //     this.uiState.title = `Unlock ${this.walletManager.activeWallet.name}`;
    //   }
    // }));

    // Verify if the wallet is already unlocked.
    if (this.walletManager.activeWallet) {
      this.uiState.title = `Unlock ${this.walletManager.activeWallet.name}`;

      if (this.secure.unlocked(this.walletManager.activeWallet?.id)) {
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
    if (this.walletManager.activeWallet) {
      const unlocked = await this.walletManager.unlockWallet(this.walletManager.activeWallet.id, this.unlockPassword);
      // this.manager.unlock(this.uiState.activeWallet.id, this.unlockPassword);

      if (unlocked) {
        if (this.uiState.action?.action) {
          this.router.navigate(['action', this.uiState.action.action]);
        } else {
          // If user has zero accounts, we'll show the account select screen that will auto-create accounts the user chooses.
          if (this.walletManager.hasAccounts) {
            this.router.navigateByUrl(`/dashboard/${this.walletManager.activeWalletId}`);
            //this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet.activeAccountIndex);
          } else {
            this.router.navigateByUrl('/account/select');
          }
        }
      } else {
        // TODO: Display error!!! .. invalid password, etc.
      }
    }
  }
}
