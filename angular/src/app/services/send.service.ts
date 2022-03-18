import { Injectable } from '@angular/core';
import { Account, AccountHistory } from '../../shared/interfaces';
import { Network } from '../../shared/networks';
import Big from 'big.js';

@Injectable({
    providedIn: 'root'
})
export class SendService {
    account: Account;
    network: Network;
    loading = false;
    address: string;
    transactionHex: string;
    transactionId: string;
    routingIndex: number;
    accountHistory: AccountHistory;

    private feeValue: Big;
    private amountValue: Big;
    private factor: number;

    get fee(): string {
        return this.feeValue.toPrecision();
    }

    /** Sets the fee, the value is expected to be of format "0.0001" */
    set fee(value: string) {
        const number = new Big(value);

        if (number.e < -8) {
            throw new TypeError('The value of fee cannot have more than 8 decimals.');
        }

        this.feeValue = number.times(this.factor);
    }

    get amount(): string {
        return this.amountValue.toPrecision();
    }

    /** Sets the fee, the value is expected to be of format "2.5" */
    set amount(value: string) {
        const number = new Big(value);

        console.log(number);

        if (number.e < -8) {
            throw new TypeError('The value of amount cannot have more than 8 decimals.');
        }

        if (number.e > 10) {
            throw new TypeError('The value of amount must be below 100000000000.');
        }

        this.amountValue = number.times(this.factor);
    }

    /** The affected addresses for the current transaction. */
    addresses: string[];

    /** Returns the amount and fee added together in satoshis. */
    get total(): Big {
        return this.amountValue.add(this.feeValue);
    }

    get amountAsSatoshi(): Big {
        return this.amountValue;
        // return new Big(this.amount).times(Math.pow(10, 8)).toNumber();
    }

    get feeAsSatoshi(): Big {
        return this.feeValue;
        // return new Big(this.fee).times(Math.pow(10, 8)).toNumber();
    }

    setExponent(exponent: number) {
        this.factor = Math.pow(10, exponent);
    }

    constructor() {
        this.factor = Math.pow(10, 8);

        // Big will only have 8 decimal points.
        // Big.DP = 8;
        // Big.NE = -8; // Default is -7.
    }

    /** Used to specify maximum amount as satoshi and fee will be subtracted from the supplied amount. */
    setMax(amount: Big) {
        if (this.fee == null) {
            throw new TypeError('Fee must be set before max can be set.');
        }

        // TODO: Validate that the input does not contains any decimals.
        // console.log('CHECK', amount);
        // if (amount.e < 0) {
        //     throw new TypeError('The amount must be in the format of satoshi.');
        // }

        const maxAmountWithoutFeeAsSats = amount.minus(this.feeValue);
        this.amountValue = maxAmountWithoutFeeAsSats;
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