import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService, UIState, NetworksService, AppManager, WalletManager } from '../../services';
import { Router } from '@angular/router';
import { ActionService } from 'src/app/services/action.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class ActionLoginComponent {
  content?: string;

  constructor(public uiState: UIState, private crypto: CryptoService, private router: Router, private app: ApplicationRef, private ngZone: NgZone, private actionService: ActionService, public networkService: NetworksService, public walletManager: WalletManager, private manager: AppManager, private cd: ChangeDetectorRef, public translate: TranslateService) {
    this.actionService.consentType = 'regular';
  }

  async ngOnInit() {
    this.uiState.title = await this.translate.get('Account.ActionIdentity').toPromise();
    this.content = this.uiState.action?.content; // await this.translate.get('Account.SigningContent').toPromise();
  }

  sign() {
    // this.manager.sign(this.content, this.uiState.action?.tabId);
    window.close();
  }

  exit() {
    this.actionService.clearAction();
  }
}
