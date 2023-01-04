import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccountHistoryStore, AddressStore, TransactionMetadataStore, TransactionStore } from 'src/shared';
import { MessageService } from 'src/shared';
import { AccountStateStore } from 'src/shared/store/account-state-store';
import { AddressWatchStore } from 'src/shared/store/address-watch-store';
import { SendService, UIState, WalletManager } from '../../../services';

@Component({
  selector: 'app-account-send-sending',
  templateUrl: './send-sending.component.html',
  styleUrls: ['./send-sending.component.css'],
})
export class AccountSendSendingComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    public sendService: SendService,
    private message: MessageService,
    public walletManager: WalletManager,
    private addressWatchStore: AddressWatchStore,
    private accountHistoryStore: AccountHistoryStore,
    private accountStateStore: AccountStateStore,
    private addressStore: AddressStore,
    private transactionStore: TransactionStore,
    private transactionMetadataStore: TransactionMetadataStore,
    public uiState: UIState
  ) {
    // When the transaction is done, we'll make sure the back button sends back to home.
    this.uiState.goBackHome = true;
  }

  ngOnDestroy() {}

  async ngOnInit() {
    this.sendService.loading = true;

    this.sendService.broadcastTransaction(this.walletManager, this.transactionMetadataStore, this.accountHistoryStore, this.accountStateStore, this.addressWatchStore, this.message);
 
    // TODO: Parse the transaction locally and update the local UI state to match the future state of the indexer, ensuring
    // a good user experience where the transaction is displayed in the history immediately. This requires updating multiple
    // stores.
    // this.transactionStore.set(this.sendService.transactionId, {
    //     blockIndex: 0,
    //     confirmations: 0,
    //     entryType: 'send',
    //     value: this.sendService.total.toNumber(),
    //     transactionHash: this.sendService.transactionId,
    //     hex: this.sendService.transactionHex,
    //     details: {
    //         transactionId: this.sendService.transactionId,
    //         blockHash: '',
    //         blockIndex: 0,
    //         confirmations: 0,
    //         fee: this.sendService.feeAsSatoshi.toNumber(),
    //         symbol: '',
    //         timestamp: 0,
    //         isCoinbase: false,
    //         isCoinstake: false,
    //         rbf: false,
    //         lockTime: 'Height : 0',
    //         version: 1,
    //         inputs: [],
    //         outputs: []
    //     }
    // });

    this.router.navigateByUrl('/account/send/success');
  }
}
