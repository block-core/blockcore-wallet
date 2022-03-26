import { Component, Inject, HostBinding, OnDestroy, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState, CommunicationService, IconService, NetworksService, NetworkStatusService, EnvironmentService, WalletManager } from '../../services';
import { copyToClipboard } from '../../shared/utilities';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as QRCode from 'qrcode';
import { Address, NetworkStatus, Transaction, TransactionView } from '../../../shared/interfaces';
import { Network } from '../../../shared/networks';
import { TransactionStore } from 'src/shared';
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
        private snackBar: MatSnackBar) {
        // this.uiState.title = 'Receive Address';
        this.uiState.goBackHome = false;
        this.uiState.backUrl = null;

        const account = this.walletManager.activeAccount;
        this.network = this.networks.getNetwork(account.networkType);

        this.activatedRoute.paramMap.subscribe(async params => {
            this.txid = params.get('txid');

            this.currentNetworkStatus = this.networkStatusService.get(this.walletManager.activeAccount.networkType);

            this.transaction = this.transactionStore.get(this.txid) as TransactionView;

            // TODO: Move this logic to an service.
            // const account = this.walletManager.activeAccount;

            // const receiveTransactions = account.state.receive.filter(item => item.transactions?.find(i => i.transactionHash == this.txid));
            // const filteredReceiveTransactions = receiveTransactions.flatMap(i => i.transactions?.find(i => i.transactionHash == this.txid));
            // const changeTransactions = account.state.change.filter(item => item.transactions?.find(i => i.transactionHash == this.txid));
            // const filteredChangeTransactions = changeTransactions.flatMap(i => i.transactions?.find(i => i.transactionHash == this.txid));

            // console.log('receiveTransactions', receiveTransactions);
            // console.log('changeTransactions', changeTransactions);

            // console.log('filteredReceiveTransactions', filteredReceiveTransactions);
            // console.log('filteredChangeTransactions', filteredChangeTransactions);

            // if (filteredReceiveTransactions.length > 0) {
            //     this.transaction = filteredReceiveTransactions[0] as TransactionView;
            // } else if (filteredChangeTransactions.length > 0) {
            //     this.transaction = filteredChangeTransactions[0] as TransactionView;
            // }

            // Calculate values on the transaction object.
            this.transaction.details.inputsAmount = this.transaction.details.inputs.reduce((sum, item) => {
                sum += item.inputAmount;
                return sum;
            }, 0);;

            this.transaction.details.outputsAmount = this.transaction.details.outputs.reduce((sum, item) => {
                sum += item.balance;
                return sum;
            }, 0);;

            // this.transaction.details.fees = this.transaction.details.inputsAmount - this.transaction.details.outputsAmount;
            this.transaction.details.data = this.transaction.details.outputs.filter(i => i.outputType == 'TX_NULL_DATA').map(i => i.scriptPubKeyAsm);

            console.log('this.transaction', this.transaction);

            // this.manager.setActiveAccountId(index);
            // this.accountName = this.uiState.activeAccount?.name;
            // this.icon = this.uiState.activeAccount?.icon;
            // console.log('ROUTE CHANGE 2');
        });
    }

    openExplorer(txid: string) {
        chrome.tabs.create({ url: `${this.env.instanceExplorerUrl}/${this.network.id}/explorer/transaction/${txid}`, active: false });
    }

    openExplorerBlock(blockhash: string) {
        if (blockhash) {
            chrome.tabs.create({ url: `${this.env.instanceExplorerUrl}/${this.network.id}/explorer/block/${blockhash}`, active: false });
        } else {
            chrome.tabs.create({ url: `${this.env.instanceExplorerUrl}/${this.network.id}/explorer/mempool`, active: false });
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
        // TODO: When can we start using .lastItem and similar functions on arrays?
        this.addressEntry = this.walletManager.activeAccount.state.receive[this.walletManager.activeAccount.state.receive.length - 1];
        this.address = this.addressEntry.address;

        try {
            this.qrCode = await QRCode.toDataURL(this.address, {
                errorCorrectionLevel: 'L',
                margin: 2,
                scale: 5,
            });

            // LEFT TO HAVE INSTRUCTIONS ON POSSIBLE OPTIONS :-)
            // this.qrCode = await QRCode.toDataURL(this.address, {
            //     // version: this.version,
            //     errorCorrectionLevel: 'L',
            //     // margin: this.margin,
            //     // scale: this.scale,
            //     // width: this.width,
            //     // color: {
            //     //     dark: this.colorDark,
            //     //     light: this.colorLight
            //     // }
            // });

        } catch (err) {
            console.error(err);
        }
    }
}