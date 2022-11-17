import { Injectable } from '@angular/core';
import { Account, AccountHistory, CoinSelectionResult } from '../../shared/interfaces';
import { Network } from '../../shared/networks';
import Big from 'big.js';
import { PaymentRequestData } from 'src/shared/payment';

@Injectable({
  providedIn: 'root',
})
export class SendService {
  account: Account;
  network: Network;
  loading = false;
  address: string;
  sendToAddress: string;
  sendAmount: string;
  changeAddress: string;
  transactionHex: string;
  transactionId: string;
  transactionError: string;
  transactionResult: string | any;
  routingIndex: number;
  accountHistory: AccountHistory;
  payment: PaymentRequestData;
  memo: string;
  feeError: string;
  selectedData: CoinSelectionResult;

  /** The amount of satoshi pr. byte that is the target minimum. */
  targetFeeRate: number;

  // The internal amount parsed to Big.
  private amountValue: Big;

  private factor: number;

  #fee: number;

  /** The fee in sat/byte format as a number. */
  get fee(): number {
    return this.#fee;
  }

  /** The fee in sat/byte format as a number. */
  set fee(value: number) {
    this.#fee = value;

    if (value < this.targetFeeRate) {
      this.feeError = `The fee cannot be lower than minimum free rate: ${this.targetFeeRate} sat/byte`;
    } else {
      this.feeError = null;
    }
  }

  get amount(): string {
    if (this.amountValue == null) {
      return '';
    }

    return this.amountValue.div(this.factor).toString();
  }

  /** Sets the amount, the value is expected to be of format "2.5" */
  set amount(value: string) {
    if (value == null || value == '') {
      this.amountValue = null;
      return;
    }

    const number = new Big(value);

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

  total: Big;

  actualAmountAsSatoshi: Big;

  get amountAsSatoshi(): Big {
    return this.amountValue;
    // return new Big(this.amount).times(Math.pow(10, 8)).toNumber();
  }

  get feeAsBig(): Big {
    return new Big(this.fee);
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
    // if (this.fee == null) {
    //   throw new TypeError('Fee must be set before max can be set.');
    // }

    // TODO: Validate that the input does not contains any decimals.
    // console.log('CHECK', amount);
    // if (amount.e < 0) {
    //     throw new TypeError('The amount must be in the format of satoshi.');
    // }

    // const maxAmountWithoutFeeAsSats = amount.minus(this.feeValue);
    this.amountValue = amount;
  }

  resetFee() {
    // If fee rate is not set, use network.
    if (!this.targetFeeRate) {
      console.log(this.network);
      this.targetFeeRate = this.network.minimumFeeRate;
      console.log('THIS NET WORK FEE RATE:', this.network.minimumFeeRate);
    }

    this.fee = this.targetFeeRate;
    // this.feeValue = new Big(this.targetFeeRate);
  }

  reset() {
    this.account = null;
    this.network = null;
    this.loading = false;
    this.address = '';
    this.changeAddress = null;
    this.amount = '0';
    this.transactionHex = '';
    this.transactionId = '';
    this.addresses = [];
    this.accountHistory = null;
    this.payment = null;
    this.memo = null;

    if (this.sendToAddress) {
      this.address = this.sendToAddress;
      this.sendToAddress = '';
    }

    if (this.sendAmount) {
      this.amount = this.sendAmount;
      this.sendAmount = '';
    }
  }
}
