import { Injectable } from '@angular/core';
import { Account, AccountHistory } from '../../shared/interfaces';
import { Network } from '../../shared/networks';
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
    ) {

    }

    /** Used to specify maximum amount and fee will be subtracted from the supplied amount. */
    setMax(amount: BigInt | number) {
        const maxAmountWithoutFee = Number(amount) - Number(this.feeAsSatoshi);
        this.amount = (maxAmountWithoutFee / SATOSHI_FACTOR).toPrecision(8);
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