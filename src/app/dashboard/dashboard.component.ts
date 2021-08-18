import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../services/crypto.service';
import { UIState } from '../services/ui-state.service';
import { Router } from '@angular/router';

export interface Section {
  name: string;
  updated: Date;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  mnemonic = '';
  password = '';
  unlocked = '';
  unlockPassword = '';
  alarmName = 'refresh';
  wallet: any;
  sub: any;
  history: Section[] = [];

  constructor(
    public uiState: UIState,
    private crypto: CryptoService,
    private router: Router,
    private cd: ChangeDetectorRef) {

    this.uiState.showBackButton = false;

    if (this.uiState.activeWallet) {
      this.uiState.title = this.uiState.activeWallet.name;
    }

  }

  ngOnInit(): void {
    this.sub = this.uiState.activeWallet$.subscribe(() => {
      if (this.uiState.activeWallet) {
        this.uiState.title = this.uiState.activeWallet.name;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
