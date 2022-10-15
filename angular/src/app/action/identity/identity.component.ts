import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService, NetworksService, AppManager, WalletManager, UIState } from '../../services';
import { Router } from '@angular/router';
import { ActionService } from 'src/app/services/action.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-identity',
  templateUrl: './identity.component.html',
  styleUrls: ['./identity.component.css'],
})
export class ActionIdentityComponent {
  content?: string;

  constructor(public uiState: UIState, private crypto: CryptoService, private router: Router, private app: ApplicationRef, private ngZone: NgZone, private action: ActionService, public networkService: NetworksService, private manager: AppManager, public walletManager: WalletManager, private cd: ChangeDetectorRef, public translate: TranslateService) {
  }

  async ngOnInit() {
    this.uiState.title = await this.translate.get('Account.ActionIdentity').toPromise();
    this.content = await this.translate.get('Account.SigningContent').toPromise(); // this.uiState.action?.document;
  }

  sign() {
    // this.manager.sign(this.content, this.uiState.action?.tabId);
    window.close();
  }

  exit() {
    this.action.clearAction();
  }
}
