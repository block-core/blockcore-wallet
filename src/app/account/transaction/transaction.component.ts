import { Component, Inject, HostBinding, OnDestroy, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState } from '../../services/ui-state.service';
import { OrchestratorService } from '../../services/orchestrator.service';
import { CommunicationService } from '../../services/communication.service';
import { IconService } from '../../services/icon.service';
import { copyToClipboard } from '../../shared/utilities';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as QRCode from 'qrcode';
import { Address, Transaction, TransactionView } from '../../interfaces';
import { NetworksService } from '../../services/networks.service';
import { Network } from '../../../background/networks';
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

    constructor(public uiState: UIState,
        private renderer: Renderer2,
        private networks: NetworksService,
        private manager: OrchestratorService,
        private activatedRoute: ActivatedRoute,
        private snackBar: MatSnackBar) {
        // this.uiState.title = 'Receive Address';
        this.uiState.goBackHome = false;

        const account = this.uiState.activeAccount;
        this.network = this.networks.getNetwork(account.network, account.purposeAddress);

        this.activatedRoute.paramMap.subscribe(async params => {
            console.log('ROUTE CHANGE 1');
            this.txid = params.get('txid');
            console.log('txid', this.txid);

            // TODO: Move this logic to an service.
            const account = this.uiState.activeAccount;

            const receiveTransactions = account.state.receive.filter(item => item.transactions?.find(i => i.transactionHash == this.txid));
            const filteredReceiveTransactions = receiveTransactions.flatMap(i => i.transactions?.find(i => i.transactionHash == this.txid));
            const changeTransactions = account.state.change.filter(item => item.transactions?.find(i => i.transactionHash == this.txid));
            const filteredChangeTransactions = changeTransactions.flatMap(i => i.transactions?.find(i => i.transactionHash == this.txid));

            console.log('receiveTransactions', receiveTransactions);
            console.log('changeTransactions', changeTransactions);

            console.log('filteredReceiveTransactions', filteredReceiveTransactions);
            console.log('filteredChangeTransactions', filteredChangeTransactions);

            if (filteredReceiveTransactions.length == 1) {
                this.transaction = filteredReceiveTransactions[0] as TransactionView;
            } else if (filteredChangeTransactions.length == 1) {
                this.transaction = filteredChangeTransactions[0] as TransactionView;
            }

            // Calculate values on the transaction object.
            this.transaction.details.inputsAmount = this.transaction.details.inputs.reduce((sum, item) => {
                sum += item.inputAmount;
                return sum;
            }, 0);;

            this.transaction.details.outputsAmount = this.transaction.details.outputs.reduce((sum, item) => {
                sum += item.balance;
                return sum;
            }, 0);;

            this.transaction.details.fees = this.transaction.details.inputsAmount - this.transaction.details.outputsAmount;

            this.transaction.details.data = this.transaction.details.outputs.filter(i => i.outputType == 'TX_NULL_DATA').map(i => i.scriptPubKeyAsm);

            // this.manager.setActiveAccountId(index);
            // this.accountName = this.uiState.activeAccount?.name;
            // this.icon = this.uiState.activeAccount?.icon;
            // console.log('ROUTE CHANGE 2');
        });


    }

    openExplorer(txid: string) {
        chrome.tabs.create({ url: `https://explorer.blockcore.net/${this.network.id}/explorer/transaction/${txid}`, active: false });
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
        this.addressEntry = this.uiState.activeAccount.state.receive[this.uiState.activeAccount.state.receive.length - 1];
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