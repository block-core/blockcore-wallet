import { Component, OnDestroy, OnInit } from '@angular/core';
import { UnspentOutputService } from 'src/app/services/unspent-output.service';
import { Account, AccountUnspentTransactionOutput } from 'src/shared';
import { SendService, SendSidechainService, WalletManager } from '../../../services';
import { payments, Psbt } from '@blockcore/blockcore-js';
import Big from 'big.js';

@Component({
  selector: 'app-account-send-confirm',
  templateUrl: './send-confirm.component.html',
  styleUrls: ['./send-confirm.component.css'],
})
export class AccountSendSidechainConfirmComponent implements OnInit, OnDestroy {
  sub: any;
  transaction: any;
  error: string;
  detailsOpen = false;
  loading = true;
  valid = false;

  constructor(public sendService: SendService, public sendSidechainService: SendSidechainService, public walletManager: WalletManager, private unspentService: UnspentOutputService) {}

  ngOnDestroy() {}

  toggleDetails() {
    this.detailsOpen = !this.detailsOpen;
  }

  async generateTransaction(account: Account, data: any) {
    const targets: any[] = [
      {
        address: this.sendService.address,
        value: this.sendService.amountAsSatoshi.toNumber(),
      },
    ];

    debugger;
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
      unspent = this.sendService.accountHistory.unspent;
    } else {
      // When performing send using a "quick" mode account, we will retrieve the UTXOs on-demand.

      // Add an additional amount to ensure we get enough UTXO value to pay for fee. We don't really know at this time
      // what the fee will actually be, so allow the UI/user to increase it if needed.
      const extraFee = this.sendService.fee * 1000; // Add an additional 10000 sats by default, or higher if user changes fee.

      const result = await this.unspentService.getUnspentByAmount(this.sendService.amountAsSatoshi.add(extraFee), account);
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
          hex = await this.walletManager.getTransactionHex(account, t.transactionHash);
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

    const selectionData = await this.walletManager.selectUtxos(utxos, targets, this.sendService.fee);

    // Set the selected data on the send service as we want to mark the UTXOs as spent after broadcast.
    this.sendService.selectedData = selectionData;

    let tx = await this.walletManager.createTransaction(
      this.walletManager.activeWallet,
      this.walletManager.activeAccount,
      this.sendService.address,
      this.sendService.changeAddress,
      this.sendService.amountAsSatoshi,
      selectionData.fee,
      selectionData.inputs,
      selectionData.outputs,
      data
    );

    return tx;
  }

  async ngOnInit() {
    try {
      const tx = await this.generateTransaction(this.walletManager.activeAccount, this.sendSidechainService.sidechainAddress);

      // Validate that we do have OP_RETURN data specified.
      if (!tx.data) {
        throw new Error('There was no data in the transaction. For sidechain swaps this is required to be the swap address. Cannot continue.');
      }

      // Calculate and set the total, take it from the outputs wince the generat transaction
      // can potentially have changed the output value (if sending max for example).
      this.sendService.actualAmountAsSatoshi = Big(tx.transaction.txOutputs[0].value);
      this.sendService.total = this.sendService.actualAmountAsSatoshi.add(tx.fee);

      this.transaction = tx;
      this.sendService.transactionHex = tx.transactionHex;
      this.sendService.addresses = tx.addresses;

      this.valid = true;
    } catch (err: any) {
      console.error(err);
      this.error = err.message;
    }

    this.loading = false;
  }
}
