import { Injectable } from '@angular/core';
import { Account, AccountHistory, AccountUnspentTransactionOutput, CoinSelectionResult } from '../../shared/interfaces';
import { Network } from '../../shared/networks';
import Big from 'big.js';
import { PaymentRequestData } from 'src/shared/payment';
import { payments } from '@blockcore/blockcore-js';
import { WalletManager } from './wallet-manager';
import { UnspentOutputService } from './unspent-output.service';

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
  walletPassword: string;

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

  async generateTransaction(walletManager: WalletManager, unspentService: UnspentOutputService, account: Account, data: any) {
    const targets: any[] = [
      {
        address: this.address,
        value: this.amountAsSatoshi.toNumber(),
      },
    ];

    // Add OP_RETURN output before we calculate fee size:
    if (data != null && data != '') {
      var buffer = Buffer.from(data);
      const dataScript = payments.embed({ data: [buffer] });

      targets.push({ script: dataScript.output, value: 0 }); // OP_RETURN always with 0 value unless you want to burn coins
      // tx.addOutput({ script: dataScript.output, value: 0 }); // OP_RETURN always with 0 value unless you want to burn coins
    }

    let utxos: any[];
    let unspent: AccountUnspentTransactionOutput[];

    if (account.mode === 'normal') {
      unspent = this.accountHistory.unspent;
    } else {
      // When performing send using a "quick" mode account, we will retrieve the UTXOs on-demand.

      // Add an additional amount to ensure we get enough UTXO value to pay for fee. We don't really know at this time
      // what the fee will actually be, so allow the UI/user to increase it if needed.
      const extraFee = this.fee * 1000; // Add an additional 10000 sats by default, or higher if user changes fee.

      const result = await unspentService.getUnspentByAmount(this.amountAsSatoshi.add(extraFee), account);
      unspent = result.utxo;

      // aggregatedAmount = result.amount;
      // inputs.push(...result.utxo);
    }

    utxos = await Promise.all(
      unspent.map(async (t): Promise<any> => {
        const container = {} as any;

        container.txId = t.transactionHash;
        container.vout = t.index;
        container.value = t.balance;
        container.address = t.address;

        let hex = t.hex;

        // If we don't have the hex, retrieve it to be used in the transaction.
        // This was needed when hex retrieval was removed to optimize extremely large wallets.
        if (!hex) {
          hex = await walletManager.getTransactionHex(account, t.transactionHash);
        }

        container.nonWitnessUtxo = Buffer.from(hex, 'hex');
        // container.witnessUtxo = {
        //   script: Buffer.from(hex, 'hex'),
        //   value: container.value,
        // };

        // TODO: Do we need nonWitnessUtxo and witnessUtxo?

        return container;
      })
    );

    const selectionData = await walletManager.selectUtxos(utxos, targets, this.fee);

    // Set the selected data on the send service as we want to mark the UTXOs as spent after broadcast.
    this.selectedData = selectionData;

    let tx = await walletManager.createTransaction(
      walletManager.activeWallet,
      walletManager.activeAccount,
      this.address,
      this.changeAddress,
      this.amountAsSatoshi,
      selectionData.fee,
      selectionData.inputs,
      selectionData.outputs,
      data
    );

    return tx;
  }
}
