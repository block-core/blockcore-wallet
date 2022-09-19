import { Component, OnDestroy, OnInit } from '@angular/core';
import { SendService, WalletManager } from '../../../services';

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
  invalidFeeAmount = false;
  loading = true;
  valid = false;

  constructor(public sendService: SendService, public walletManager: WalletManager) {}

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

      const tx = await this.walletManager.createTransaction(
        this.walletManager.activeWallet,
        this.walletManager.activeAccount,
        this.sendService.address,
        this.sendService.changeAddress,
        this.sendService.amountAsSatoshi,
        this.sendService.feeAsSatoshi,
        this.sendService.accountHistory.unspent,
        data
      );

      this.transaction = tx;
      this.sendService.transactionHex = tx.transactionHex;
      this.sendService.addresses = tx.addresses;
      this.invalidFeeAmount = this.transaction.feeRate < this.sendService.feeRate;

      // TODO: Add aditional conditions here if needed for validating the transaction before allowing
      // it to be broadcasted. Perhaps checking the network status?
      if (this.invalidFeeAmount) {
        this.valid = false;
      } else {
        this.valid = true;
      }
    } catch (err: any) {
      console.error(err);
      this.error = err.message;
    }

    this.loading = false;
  }
}
