import { Component, Inject, HostBinding, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../services/crypto.service';
import { UIState } from '../services/ui-state.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  mnemonic = '';
  password = '';
  unlocked = '';
  unlockPassword = '';
  alarmName = 'refresh';
  wallet: any;

  constructor(
    public uiState: UIState,
    private crypto: CryptoService,
    private router: Router,
    private cd: ChangeDetectorRef) {

    this.uiState.title = 'Your Wallet';
  }
}
