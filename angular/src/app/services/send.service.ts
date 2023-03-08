import { Injectable } from '@angular/core';
import { Account, AccountHistory, AccountUnspentTransactionOutput, CoinSelectionResult } from '../../shared/interfaces';
import { Network } from '../../shared/networks';
import Big from 'big.js';
import { PaymentRequestData } from 'src/shared/payment';
import { payments } from '@blockcore/blockcore-js';
import { WalletManager } from './wallet-manager';
import { UnspentOutputService } from './unspent-output.service';
import { AccountHistoryStore, AccountStateStore, AddressWatchStore, MessageService, TransactionMetadataStore } from 'src/shared';

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

  resetError() {
    this.transactionError = null;
    this.feeError = null;
  }

  async broadcastTransaction(
    walletManager: WalletManager,
    transactionMetadataStore: TransactionMetadataStore,
    accountHistoryStore: AccountHistoryStore,
    accountStateStore: AccountStateStore,
    addressWatchStore: AddressWatchStore,
    message: MessageService
  ) {
    const transactionDetails = await walletManager.sendTransaction(this.account, this.transactionHex);
    // Replace with test data to simulate an actual transaction broadcast.
    // const transactionDetails = {
    //   transactionHex: '01000000638c8a6301c1d0793c5babee26351e5fd150505777f0344978097c882acb519b16516d0128000000006a473044022017bccecbe3458634683a6db4b1a485454855add3d582507885507246a64aaffe022049213cf0ae49f6bc509fc2f4ad5d2916d24cbd4d192e55c33f2c00218fec774c0121026add073b767e0795042276d4525c9dda85820cb6e92a1acb9dc11f8a01a58409ffffffff0200e1f505000000001976a914668782a465c4027312434e7ae1cea0cd2837484c88ac4a7ad717000000001976a9148e25224a6674da8843280d59e9bdd2750b9db4af88ac00000000',
    //   transactionResult: '1c72f48428ea20156e34bebc7a9cd1a3f6fd02ba9fe1d7d8825984817b112257'
    // };

    this.loading = false;
    this.transactionResult = transactionDetails.transactionResult;

    if (typeof transactionDetails.transactionResult !== 'string') {
      this.transactionError = this.transactionResult.title;

      // Examples:
      // {"title":"bad-txns-inputs-missingorspent","status":200,"traceId":"00-6cae22bb805a8698ffe313f5130f040c-ddbb8afdb391e115-00"}
      // {"title":"tx-size","status":200,"traceId":"00-859d81fbef41ef9f7832aeaf0f88615b-75998b079a941280-00"}
    } else {
      this.transactionId = this.transactionResult;

      // This means the transaction was sent successfully, we should now mark the UTXOs as spent.
      this.selectedData.inputs.forEach((i) => {
        const existingUTXO = this.accountHistory.unspent.find((u) => u.transactionHash == i.txId && u.address == i.address && u.index == i.vout);

        if (existingUTXO) {
          existingUTXO.spent = true;
        }
      });

      // When the transaction is successfull, we'll store the metadata for it.
      let txMetadata = transactionMetadataStore.get(this.account.identifier);

      if (!txMetadata) {
        txMetadata = {
          accountId: this.account.identifier,
          transactions: [],
        };

        transactionMetadataStore.set(txMetadata.accountId, txMetadata);
      }

      let metadataEntry = txMetadata.transactions.find((t) => t.transactionHash == this.transactionId);

      if (metadataEntry) {
        // This should never happen?
      } else {
        metadataEntry = {
          transactionHash: this.transactionId,
          memo: this.memo,
          payment: this.payment?.options,
        };

        txMetadata.transactions.push(metadataEntry);
        await transactionMetadataStore.save();
      }
    }

    this.transactionHex = transactionDetails.transactionHex;

    // After we send the transaction, we will persist the account history store because the spent
    // utxos have been marked in the createTransaction method.
    await accountHistoryStore.save();

    // Reload the watch store to ensure we have latest state, the watcher might have updated (and removed) some values.
    await addressWatchStore.load();

    await accountStateStore.load();

    const accountState = accountStateStore.get(this.account.identifier);

    for (let i = 0; i < this.addresses.length; i++) {
      const address = this.addresses[i];

      let index = accountState.receive.findIndex((a) => a.address == address);

      if (index === -1) {
        index = accountState.change.findIndex((a) => a.address == address);
      }

      // If we cannot find the address that is involved with this transaction, don't add a watch.
      if (index > -1) {
        addressWatchStore.set(address, {
          address,
          accountId: this.account.identifier,
          count: 0,
        });
      }
    }

    // Save the watch store so the background watcher will see the new entries.
    await addressWatchStore.save();

    // Trigger watch process to start immediately now that we've broadcasted a new transaction.
    message.send(message.createMessage('watch', {}, 'background'));
  }

  async generateTransaction(unspentService: UnspentOutputService, walletManager: WalletManager, account: Account, data?: any, targets?: any[]) {
    if (!targets) {
      targets = [
        {
          address: this.address,
          value: this.amountAsSatoshi.toNumber(),
        },
      ];
    }

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

    let tx = await walletManager.createTransaction(walletManager.activeWallet, walletManager.activeAccount, this.address, this.changeAddress, this.amountAsSatoshi, selectionData.fee, selectionData.inputs, selectionData.outputs, data);

    return tx;
  }
}
