import { Injectable } from '@angular/core';
import { Account, AccountHistory } from '../../shared/interfaces';
import { Network } from '../../shared/networks';
import { SATOSHI_FACTOR } from '../shared/constants';
import Big from 'big.js';

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
    factor = Math.pow(10, 8);

    constructor() {
    }

    /** The affected addresses for the current transaction. */
    addresses: string[];

    get total(): BigInt | any {
        return this.amountAsSatoshi + this.feeAsSatoshi;
    }

    get amountAsSatoshi(): number {
        return new Big(this.amount).times(this.factor).toNumber();
    }

    get feeAsSatoshi(): number {
        return new Big(this.fee).times(this.factor).toNumber();
    }

    /** Used to specify maximum amount and fee will be subtracted from the supplied amount. */
    setMax(amount: number) {
        const maxAmountWithoutFee = amount - this.feeAsSatoshi;
        const amountWithoutFee = new Big(this.fee).div(this.factor);
        this.amount = amountWithoutFee.toPrecision(8);
        // this.amount = (maxAmountWithoutFee / SATOSHI_FACTOR).toPrecision(8);
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