import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UIState } from './ui-state.service';
import { CommunicationService } from './communication.service';
import { Account, AccountHistory, Action, Identity, Settings, State, Vault } from '../../shared/interfaces';
import {
    MatSnackBar,
    MatSnackBarHorizontalPosition,
    MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { Network } from '../../shared/networks';
import { SATOSHI_FACTOR } from '../shared/constants';
import { AccountHistoryStore } from 'src/shared';

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
    SATOSHI_FACTOR: any = SATOSHI_FACTOR;
    routingIndex: number;
    public accountHistory: AccountHistory;

    /** The affected addresses for the current transaction. */
    addresses: string[];

    get total(): BigInt | any {
        return this.amountAsSatoshi + this.feeAsSatoshi;
    }

    get amountAsSatoshi(): BigInt | any {
        const amountAsDecimal = Number(this.amount) * SATOSHI_FACTOR;
        return BigInt(amountAsDecimal);
    }

    get feeAsSatoshi(): BigInt | any {
        const feeAsDecimal = Number(this.fee) * SATOSHI_FACTOR;
        return BigInt(feeAsDecimal);
    }

    constructor(
        private communication: CommunicationService,
        private uiState: UIState,
        private router: Router,
        private accountHistoryStore: AccountHistoryStore,
        private snackBar: MatSnackBar
    ) {
        // this.communication.listen('transaction-sent', async (data: { transactionId: string, transactionHex: string }) => {
        //     this.loading = false;
        //     this.transactionId = data.transactionId;
        //     this.transactionHex = data.transactionHex;
        // });

        

    }

    /** Used to specify maximum amount and fee will be subtracted from the supplied amount. */
    setMax(amount: BigInt | number) {
        const maxAmountWithoutFee = Number(amount) - Number(this.feeAsSatoshi);
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
        this.addresses = [];
        this.accountHistory = null;
    }
}