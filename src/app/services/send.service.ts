import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UIState } from './ui-state.service';
import { CommunicationService } from './communication.service';
import { Account, Action, Identity, Settings, State, Vault } from '../interfaces';
import {
    MatSnackBar,
    MatSnackBarHorizontalPosition,
    MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { Network } from '../../background/networks';
import { SATOSHI_FACTOR } from '../shared/constants';

@Injectable({
    providedIn: 'root'
})
export class SendService {

    account: Account;
    network: Network;
    loading = false;
    address: string;
    amount: string;
    fee: string;
    transactionHex: string;
    transactionId: string;
    SATOSHI_FACTOR = SATOSHI_FACTOR;
    routingIndex: number;

    get total() {
        return Number(this.amount) + Number(this.fee);
    }

    get amountAsSatoshi() {
        return Number(this.amount) * SATOSHI_FACTOR;
    }

    get feeAsSatoshi() {
        return Number(this.fee) * SATOSHI_FACTOR;
    }

    constructor(
        private communication: CommunicationService,
        private uiState: UIState,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        // this.communication.listen('transaction-sent', async (data: { transactionId: string, transactionHex: string }) => {
        //     this.loading = false;
        //     this.transactionId = data.transactionId;
        //     this.transactionHex = data.transactionHex;
        // });
    }

    /** Used to specify maximum amount and fee will be subtracted from the supplied amount. */
    setMax(amount: number | BigInt) {
        const maxAmountWithoutFee = <number>amount - this.feeAsSatoshi;
        this.amount = (maxAmountWithoutFee / SATOSHI_FACTOR).toPrecision(8);
    }

    send() {
        this.loading = true;
        // this.communication.send('account-send', { address: this.address, amount: this.amount, fee: this.fee });
        this.router.navigate(['success']);
    }

    resetFee() {
        this.fee = this.network.feeRate;
    }

    reset() {
        this.account = null;
        this.network = null;
        this.loading = false;
        this.address = '';
        this.amount = '';
        this.transactionHex = '';
        this.transactionId = '';
    }
}