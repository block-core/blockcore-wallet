import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService, UIState, NetworksService, AppManager, WalletManager } from '../../services';
import { Router } from '@angular/router';
import { ActionService } from 'src/app/services/action.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class ActionLoginComponent {
  content?: string;

  constructor(public uiState: UIState, private crypto: CryptoService, private router: Router, private app: ApplicationRef, private ngZone: NgZone, private action: ActionService, public networkService: NetworksService, public walletManager: WalletManager, private manager: AppManager, private cd: ChangeDetectorRef) {
    this.uiState.title = 'Action: Login';

    this.content = this.uiState.action?.document;
  }

  sign() {
    // this.manager.sign(this.content, this.uiState.action?.tabId);
    window.close();
  }

  exit() {
    this.action.clearAction();
  }
}
