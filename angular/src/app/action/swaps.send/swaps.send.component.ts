import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService, UIState, NetworksService, AppManager, WalletManager, SendService } from '../../services';
import { Router } from '@angular/router';
import { ActionService } from 'src/app/services/action.service';
// import * as browser from 'webextension-polyfill';
import { AccountHistoryStore, AccountStateStore, ActionMessage, AddressStore, AddressWatchStore, MessageService, Permission, TransactionMetadataStore, TransactionStore } from 'src/shared';
import { PermissionStore } from 'src/shared/store/permission-store';
import { Actions, PERMISSIONS } from 'src/app/shared/constants';
import { UnspentOutputService } from 'src/app/services/unspent-output.service';
import { MatDialog } from '@angular/material/dialog';
const { v4: uuidv4 } = require('uuid');
import { map, switchMap } from 'rxjs';
import { Network } from 'src/shared/networks';

@Component({
  selector: 'app-swaps-send',
  templateUrl: './swaps.send.component.html',
  styleUrls: ['./swaps.send.component.css'],
})
export class ActionSwapsSendComponent {
  contentToSign: string;
  content: any;

  constructor(
    public uiState: UIState,
    private permissionStore: PermissionStore,
    public actionService: ActionService,
    public networkService: NetworksService,
    public walletManager: WalletManager,
    private unspentService: UnspentOutputService,
    private manager: AppManager,
    private cd: ChangeDetectorRef,
    private sendService: SendService,
    public dialog: MatDialog,
    private accountHistoryStore: AccountHistoryStore,
    private addressWatchStore: AddressWatchStore,
    private accountStateStore: AccountStateStore,
    private addressStore: AddressStore,
    private transactionStore: TransactionStore,
    private transactionMetadataStore: TransactionMetadataStore,
    private message: MessageService
  ) {
    this.content = uiState.action.content;
    this.contentToSign = JSON.stringify(this.content);
    this.actionService.consentType = 'ephemeral';
    this.actionService.permissionLevel = 'account';

    this.actionService.accountFilter = { symbol: this.content.network };

    this.actionService.status.icon = 'currency_bitcoin';
    this.actionService.status.title = 'Swap Coins';
    this.actionService.status.description = `App wants you to perform an atomc swap`;

    this.actionService.component = this;
  }

}
