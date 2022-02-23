import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CryptoService } from '../services/crypto.service';
import { UIState } from '../services/ui-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunicationService } from '../services/communication.service';
import { NETWORK_IDENTITY } from '../shared/constants';
import { WalletManager } from '../services/wallet-manager';

@Component({
  selector: 'app-vault',
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.css']
})
export class VaultComponent implements OnInit, OnDestroy {
  mnemonic = '';
  password = '';
  unlocked = '';
  unlockPassword = '';
  alarmName = 'refresh';
  wallet: any;
  account!: any;
  // sub: any;
  previousIndex!: number;

  constructor(
    public uiState: UIState,
    private crypto: CryptoService,
    private router: Router,
    private communication: CommunicationService,
    private activatedRoute: ActivatedRoute,
    public walletManager: WalletManager,
    private cd: ChangeDetectorRef) {

    this.uiState.title = 'Account: ';
    this.uiState.showBackButton = true;

    if (!this.walletManager.hasAccounts) {
      this.router.navigateByUrl('/account/create');
    }

    this.activatedRoute.paramMap.subscribe(async params => {
      console.log('PARAMS:', params);
      const index: any = params.get('index');
      // console.log('Account Index:', Number(index));

      console.log('Index to view:', index);

      if (!this.walletManager.activeWallet) {
        return;
      }

      // this.manager.setActiveAccountId(index);
      this.uiState.title = 'Account: ' + this.walletManager.activeAccount?.name;

      this.previousIndex = index;

      if (this.walletManager.activeAccount?.network == NETWORK_IDENTITY) {
        this.router.navigate(['account', 'view', 'identity', index]);
      }

      // this.uiState.persisted.activeAccountIndex = Number(index);
      // Persist when changing accounts.
      // this.uiState.save();
    });
  }

  ngOnDestroy(): void {
    // if (this.sub) {
    //   this.communication.unlisten(this.sub);
    // }
  }

  ngOnInit(): void {
    // this.sub = this.communication.listen('active-account-changed', (data: any) => {
    //   // If we are currently viewing an account and the user changes, we'll refresh this view.
    //   if (this.previousIndex != data.index) {
    //     console.log('active-account-changed!!!! DIFFERENT, WILL NAVIGATE!');
    //     this.router.navigate(['account', 'view', data.index]);
    //   }
    // });
  }
}
