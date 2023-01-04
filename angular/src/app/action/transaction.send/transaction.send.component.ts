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
import { SendConfirmationDialog, SendConfirmationDialogData } from './send-confirmation-dialog/send-confirmation-dialog';
const { v4: uuidv4 } = require('uuid');
import { map, switchMap } from 'rxjs';
import { Network } from 'src/shared/networks';

@Component({
  selector: 'app-transaction-send',
  templateUrl: './transaction.send.component.html',
  styleUrls: ['./transaction.send.component.css'],
})
export class ActionTransactionSendComponent {
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

    this.actionService.status.icon = 'currency_bitcoin';
    this.actionService.status.title = 'Send Transaction';
    this.actionService.status.description = `App wants you to perform a transaction`;

    this.actionService.component = this;
  }

  confirm(amount: number, symbol: string) {
    const dialogRef = this.dialog.open(SendConfirmationDialog, {
      data: { amount: amount, symbol: symbol },
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    return dialogRef
      .afterClosed()
      .pipe(
        map(async (data: any) => {
          if (!data) {
            return false;
          }

          const txInfo = await this.pay();

          // // If there are no errors, broadcast the transaction to the website:
          // const reply: any = {
          //   prompt: false, // This indicates that message comes from the popup promt.
          //   target: 'provider',
          //   source: 'tabs',
          //   ext: 'blockcore',
          //   // permission: 'once',
          //   request: { method: 'payment', params: undefined }, // Re-create the request object.
          //   type: 'broadcast',
          //   response: { content: txInfo },
          //   // response: { content: action.content },
          //   // id: this.uiState.action.id,
          //   // type: this.uiState.action.action,
          //   // app: this.uiState.action.app,
          //   // walletId: this.walletManager.activeWalletId,
          //   // accountId: this.accountId,
          //   // keyId: this.sendService.transactionId,
          //   // key: this.sendService.transactionHex,
          // };

          // // Inform the provider script that user has signed the data.
          // this.message.send(reply);

          // How can we be sure that the message is received before logic continues? Maybe need a sleep here?

          return txInfo;
        })
      )
      .toPromise();
  }

  async authorize(permission: string) {
    const totalAmount = this.content.recipients.reduce((partialSum: number, a: any) => Number(partialSum) + Number(a.amount), 0);
    const network = this.networkService.getNetwork(this.walletManager.activeAccount.networkType);

    return this.confirm(totalAmount, network.symbol);
  }

  async pay() {
    const network = this.networkService.getNetwork(this.walletManager.activeAccount.networkType);
    const recipient = this.content.recipients[0];
    this.sendService.amount = recipient.amount;
    this.sendService.fee = Number(network.minimumFeeRate); // Also use the .feeRate from action data input to choose fee.
    this.sendService.account = this.walletManager.activeAccount;

    const targets = this.content.recipients.map((r: any) => {
      return { address: r.address, value: r.amount };
    });

    this.sendService.accountHistory = this.accountHistoryStore.get(this.walletManager.activeAccount.identifier);
    const tx = await this.sendService.generateTransaction(this.unspentService, this.walletManager, this.walletManager.activeAccount, this.content.data, targets);

    this.sendService.transactionHex = tx.transactionHex;
    this.sendService.addresses = tx.addresses;

    await this.sendService.broadcastTransaction(this.walletManager, this.transactionMetadataStore, this.accountHistoryStore, this.accountStateStore, this.addressWatchStore, this.message);

    const result = {
      transactionId: this.sendService.transactionId,
      transactionHex: this.sendService.transactionHex,
    };

    this.sendService.reset();

    return result;
  }
}
