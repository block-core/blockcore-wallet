import { Component, OnDestroy, OnInit } from '@angular/core';
import Big from 'big.js';
import { Account, AccountUnspentTransactionOutput } from 'src/shared';
import { SendService, WalletManager } from '../../../services';
import { payments, Psbt } from '@blockcore/blockcore-js';
import { UnspentOutputService } from 'src/app/services/unspent-output.service';

@Component({
  selector: 'app-account-send-confirm',
  templateUrl: './send-confirm.component.html',
  styleUrls: ['./send-confirm.component.css'],
})
export class AccountSendConfirmComponent implements OnInit, OnDestroy {
  sub: any;
  transaction: any;
  error: string;
  detailsOpen = false;
  loading = true;
  valid = false;

  constructor(public sendService: SendService, public walletManager: WalletManager, private unspentService: UnspentOutputService) {}

  ngOnDestroy() {}

  toggleDetails() {
    this.detailsOpen = !this.detailsOpen;
  }

  byteToBinaryString(s: any) {
    return s.toString(2).padStart(8, '0');
  }

  dataSize(data: string) {
    const buffer = Buffer.from(data);
    return buffer.length;
  }

  dataFormat(data: string, format: string) {
    if (format == 'binary') {
      const buffer = Buffer.from(data);
      const text = [...buffer].map(this.byteToBinaryString).join(' ');
      return text;
    } else if (format == 'hex') {
      const buffer = Buffer.from(data);
      return buffer.toString('hex');
    } else if (format == 'utf8') {
      //   var decoder = new TextDecoder('utf-8');
      //   var decodedMessage = decoder.decode(data);
      return data;
    } else {
      return data;
    }
  }

  async ngOnInit() {
    try {
      let data = this.sendService.payment?.options.data;

      if (data != null) {
        var enc = new TextEncoder(); // always utf-8
        var arr = enc.encode(data);

        // Slice the data and only read 80 bytes:
        const sliced = arr.slice(0, 80); // Enforce the max length of 80 on OP_RETURN data.

        // Decode the array back into UTF-8:
        var dec = new TextDecoder('utf-8');
        data = dec.decode(sliced);
      }

      const tx = await this.sendService.generateTransaction(this.unspentService, this.walletManager, this.walletManager.activeAccount, data);

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
