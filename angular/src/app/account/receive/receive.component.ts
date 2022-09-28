import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { UIState, NetworksService, WalletManager } from '../../services';
import { copyToClipboard } from '../../shared/utilities';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as QRCode from 'qrcode';
import { Address } from '../../../shared/interfaces';
import { Network } from '../../../shared/networks';
import { AccountStateStore } from 'src/shared/store/account-state-store';
import { ExchangeService } from 'src/app/services/exchange.service';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
var QRCode2 = require('qrcode');
import { PaymentRequest } from 'src/shared/payment';
import { InputValidators } from 'src/app/services/inputvalidators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-account-receive',
  templateUrl: './receive.component.html',
  styleUrls: ['./receive.component.css'],
})
export class AccountReceiveComponent implements OnInit, OnDestroy {
  addressEntry: Address;
  address: string;
  paymentAddress: string;
  paymentRequest: string;
  qrCode: string;
  qrPayment: string;
  network: Network;
  form: UntypedFormGroup;
  amount: string;
  receiveAddressCaption: string;

  constructor(
    private fb: UntypedFormBuilder,
    private payment: PaymentRequest,
    private exchange: ExchangeService,
    public uiState: UIState,
    private renderer: Renderer2,
    private networks: NetworksService,
    public walletManager: WalletManager,
    private accountStateStore: AccountStateStore,
    private snackBar: MatSnackBar,
    public translate: TranslateService
  ) {
    // this.uiState.title = 'Receive Address';
    this.uiState.goBackHome = false;
    this.uiState.backUrl = null;

    const account = this.walletManager.activeAccount;
    this.network = this.networks.getNetwork(account.networkType);

    this.form = fb.group({
      addressInput: new UntypedFormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(200)]),
      amountInput: new UntypedFormControl('', [Validators.min(0), Validators.pattern(/^-?(0|[0-9]+[.]?[0-9]*)?$/)]),

      // TODO: Tune the max lengths, for now we'll make them fairly small.
      labelInput: new UntypedFormControl('', [Validators.maxLength(42)]),
      messageInput: new UntypedFormControl('', [Validators.maxLength(100)]),

      dataInput: new UntypedFormControl('', [InputValidators.maxBytes(80)]),
      identifierInput: new UntypedFormControl('', [Validators.maxLength(36)]),
    });

    this.form.valueChanges.subscribe(async (value) => {
      await this.updatePayment();
    });
  }

  ngOnDestroy(): void { }

  async copy() {
    copyToClipboard(this.address);

    this.snackBar.open(await this.translate.get('Account.ReceiveAddressCopiedToClipboard').toPromise(), await this.translate.get('Account.ReceiveAddressCopiedToClipboardAction').toPromise(), {
      duration: 1500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  bytesLength(input: string) {
    if (input == null) {
      return 0;
    }

    var enc = new TextEncoder();
    var arr = enc.encode(input);
    return arr.length;
  }

  async copyPayment() {
    copyToClipboard(this.paymentRequest);

    this.snackBar.open(await this.translate.get('Account.PaymentRequestCopiedToClipboard').toPromise(), await this.translate.get('Account.PaymentRequestCopiedToClipboardAction').toPromise(), {
      duration: 1500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  openExolix(address: string, network: Network) {
    this.exchange.buyPopup(address, network, 0.01);
  }

  openSimplex(address: string, network: Network) {
    this.exchange.purchasePopup(address, network.symbol, 'USD', '200');
  }

  async updatePayment() {
    try {
      const network = this.network.symbol.toLowerCase();

      // web+pay://city:Ccoquhaae7u6ASqQ5BiYueASz8EavUXrKn?amount=10&label=Your Local Info&message=Invoice Number 5&data=MzExMzUzNDIzNDY&id=4324
      const uri = this.payment.encode({
        address: this.form.controls['addressInput'].value,
        network: network,
        options: {
          amount: this.form.controls['amountInput'].value,
          label: this.form.controls['labelInput'].value,
          message: this.form.controls['messageInput'].value,
          data: this.form.controls['dataInput'].value,
          id: this.form.controls['identifierInput'].value,
        },
      });

      // Should this be prefixed with web+pay? Probably not.
      const qrData = `${uri}`;

      this.paymentRequest = `web+pay://${uri}`;

      this.qrPayment = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'L',
        margin: 2,
        scale: 5,
      });

      // LEFT TO HAVE INSTRUCTIONS ON POSSIBLE OPTIONS :-)
      // this.qrCode = await QRCode.toDataURL(this.address, {
      //     // version: this.version,
      //     errorCorrectionLevel: 'L',
      //     // margin: this.margin,
      //     // scale: this.scale,
      //     // width: this.width,
      //     // color: {
      //     //     dark: this.colorDark,
      //     //     light: this.colorLight
      //     // }
      // });
    } catch (err) {
      console.error(err);
    }
  }

  async ngOnInit() {
    this.receiveAddressCaption = await this.translate.get('Account.ReceiveAddressCaption', { symbol: this.network.symbol, name: this.network.name }).toPromise();

    const accountState = this.accountStateStore.get(this.walletManager.activeAccount.identifier);

    // When using CRS/TCRS, the change address should always be the primary address.
    if (this.network.singleAddress === true || this.walletManager.activeAccount.singleAddress === true) {
      this.addressEntry = accountState.receive[0];
    } else {
      // TODO: When can we start using .lastItem and similar functions on arrays?
      this.addressEntry = accountState.receive[accountState.receive.length - 1];
    }

    this.address = this.addressEntry.address;

    // Copy the address to payment, but allow payment to be customized.
    this.paymentAddress = this.address;

    try {
      this.qrCode = await QRCode.toDataURL(this.address, {
        errorCorrectionLevel: 'L',
        margin: 2,
        scale: 5,
      });

      // LEFT TO HAVE INSTRUCTIONS ON POSSIBLE OPTIONS :-)
      // this.qrCode = await QRCode.toDataURL(this.address, {
      //     // version: this.version,
      //     errorCorrectionLevel: 'L',
      //     // margin: this.margin,
      //     // scale: this.scale,
      //     // width: this.width,
      //     // color: {
      //     //     dark: this.colorDark,
      //     //     light: this.colorLight
      //     // }
      // });
    } catch (err) {
      console.error(err);
    }

    await this.updatePayment();
  }
}
