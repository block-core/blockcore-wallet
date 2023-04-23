import { Component, ChangeDetectorRef, ApplicationRef, NgZone, OnInit } from '@angular/core';
import { CryptoService, UIState, NetworksService, CommunicationService, AppManager, WalletManager } from '../../services';
import { Router } from '@angular/router';
import { ActionService } from '../../services/action.service';
import { TranslateService } from '@ngx-translate/core';
import { nostrPrivateChannelAccountName } from '../../../shared/handlers/nostr-nip76-wallet-handler';
const { v4: uuidv4 } = require('uuid');

@Component({
  selector: 'app-nostr-nip76-root',
  templateUrl: './nostr-nip76-root.component.html',
  styleUrls: ['./nostr-nip76-root.component.css']
})
export class ActionNostrNip76RootComponent implements OnInit {
  content?: string;
  parameters?: any;
  expiryDate: Date;
  callback: string;
  result: string;
  success?: boolean;
  mnemonic: string;

  constructor(
    public uiState: UIState,
    private crypto: CryptoService,
    private router: Router,
    private app: ApplicationRef,
    private actionService: ActionService,
    private ngZone: NgZone,
    private communication: CommunicationService,
    public networkService: NetworksService,
    public walletManager: WalletManager,
    private manager: AppManager,
    private cd: ChangeDetectorRef,
    public translate: TranslateService) {

      this.actionService.status.title = 'Create an HDK Index Wallet';
      this.actionService.status.description = 
        `Creates a separate NIP-76 Hierarchical Deterministic Key Wallet Root used for indexing and encrypting Nostr Events.`;
      this.actionService.consentType = 'regular';
      this.actionService.permissionLevel = 'account';
      // this.actionService.accountId = walletManager.activeAccountId;
  }

  ngOnDestroy(): void {

  }

  async ngOnInit() {
    const accountTranslate = await this.translate.get('Account.Account').toPromise();
    this.uiState.title = accountTranslate + ': ' + this.walletManager.activeAccount?.name;
    this.mnemonic = this.crypto.generateMnemonic();
    // this.createPrivateChannelAccount();
  }

  async createPrivateChannelAccount() {
    let account = this.walletManager.activeWallet.accounts.find(x => x.name === nostrPrivateChannelAccountName);
    if (!account) {
      account = {
        identifier: uuidv4(),
        type: 'identity',
        mode: 'normal',
        singleAddress: true,
        networkType: 'NOSTR',
        name: nostrPrivateChannelAccountName,
        index: 1776,
        network: 1237,
        purpose: 44,
        purposeAddress: 340,
        icon: 'account_circle',
      };
      await this.walletManager.addAccount(account, this.walletManager.activeWallet);
    }
    this.actionService.accountId = account.identifier;
  }
}
