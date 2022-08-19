import { Component, Inject, HostBinding, OnDestroy, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState, CommunicationService, IconService, NetworksService, NetworkStatusService, EnvironmentService, WalletManager, LoggerService } from '../../services';
import { copyToClipboard } from '../../shared/utilities';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as QRCode from 'qrcode';
import { Address, NetworkStatus, Transaction, TransactionView } from '../../../shared/interfaces';
import { Network } from '../../../shared/networks';
import { TransactionStore } from 'src/shared';
import { AccountStateStore } from 'src/shared/store/account-state-store';
import { RuntimeService } from 'src/shared/runtime.service';
var QRCode2 = require('qrcode');

@Component({
    selector: 'app-account-transaction',
    templateUrl: './transaction.component.html',
    styleUrls: ['./transaction.component.css']
})
export class AccountTransactionComponent implements OnInit, OnDestroy {

    addressEntry: Address;
    address: string;
    qrCode: string;
    network: Network;
    public transaction: TransactionView;
    txid: string;
    currentNetworkStatus: NetworkStatus;

    constructor(public uiState: UIState,
        private renderer: Renderer2,
        private networks: NetworksService,
        private activatedRoute: ActivatedRoute,
        private env: EnvironmentService,
        private networkStatusService: NetworkStatusService,
        public walletManager: WalletManager,
        private transactionStore: TransactionStore,
        private logger: LoggerService,
        private snackBar: MatSnackBar,
        private runtime: RuntimeService) {
        this.uiState.goBackHome = false;
        this.uiState.backUrl = null;

        const account = this.walletManager.activeAccount;
        this.network = this.networks.getNetwork(account.networkType);

        this.activatedRoute.paramMap.subscribe(async params => {
            this.txid = params.get('txid');
            // this.currentNetworkStatus = this.networkStatusService.get(this.walletManager.activeAccount.networkType);
            this.transaction = this.transactionStore.get(this.txid) as TransactionView;

            // Calculate values on the transaction object.
            this.transaction.details.inputsAmount = this.transaction.details.inputs.reduce((sum, item) => {
                sum += item.inputAmount;
                return sum;
            }, 0);;

            this.transaction.details.outputsAmount = this.transaction.details.outputs.reduce((sum, item) => {
                sum += item.balance;
                return sum;
            }, 0);;

            this.transaction.details.data = this.transaction.details.outputs.filter(i => i.outputType == 'TX_NULL_DATA').map(i => i.scriptPubKeyAsm);
            this.logger.info('Transaction:', this.transaction);
        });
    }

    openExplorer(txid: string) {
      if (!this.runtime.isExtension) {
        window.open(`${this.env.instanceExplorerUrl}/${this.network.id}/explorer/transaction/${txid}`, '_blank').focus();
      }
      else
      {
        chrome.tabs.create({ url: `${this.env.instanceExplorerUrl}/${this.network.id}/explorer/transaction/${txid}`, active: false });
      }
    }

    openExplorerBlock(blockhash: string) {
      if (blockhash) {
        if (!this.runtime.isExtension) {
          window.open(`${this.env.instanceExplorerUrl}/${this.network.id}/explorer/block/${blockhash}`, '_blank').focus();
         }
        else
        {
          chrome.tabs.create({ url: `${this.env.instanceExplorerUrl}/${this.network.id}/explorer/block/${blockhash}`, active: false });
        }
        }
      else {
        if (!this.runtime.isExtension) {
          window.open(`${this.env.instanceExplorerUrl}/${this.network.id}/explorer/block/${blockhash}`, '_blank').focus();
        }
        else
        {
          chrome.tabs.create({ url: `${this.env.instanceExplorerUrl}/${this.network.id}/explorer/block/${blockhash}`, active: false });
        }
      }
    }

    ngOnDestroy(): void {

    }

    copy() {
        copyToClipboard(this.txid);

        this.snackBar.open('Transaction ID copied to clipboard', 'Hide', {
            duration: 1500,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
        });
    }

    async ngOnInit() {

    }
}
