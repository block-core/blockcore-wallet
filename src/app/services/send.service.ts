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

    get total() {
        return Number(this.amount) + Number(this.fee);
    }

    constructor(
        private communication: CommunicationService,
        private uiState: UIState,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        this.communication.listen('account-sent', async (data: { transactionId: string, transactionHex: string }) => {
            this.loading = false;
            this.transactionId = data.transactionId;
            this.transactionHex = data.transactionHex;
        });
    }

    send() {
        this.loading = true;
        // this.communication.send('account-send', { address: this.address, amount: this.amount, fee: this.fee });
        this.router.navigate(['success']);
    }

    reset() {
        this.account = null;
        this.network = null;
        this.loading = false;
        this.address = '';
        this.amount = '';
        this.fee = '';
        this.transactionHex = '';
        this.transactionId = '';
    }
}