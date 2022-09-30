import { Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import Big from 'big.js';
import { InputValidators } from 'src/app/services/inputvalidators';
import { SATOSHI_FACTOR } from 'src/app/shared/constants';
import { WalletManager, UIState, SendService, NetworkStatusService } from '../../../services';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { QrScanDialog } from './qr-scanning.component';
import { AddressValidationService } from 'src/app/services/address-validation.service';
import { PaymentRequest } from 'src/shared/payment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-account-send-address',
  templateUrl: './send-address.component.html',
  styleUrls: ['./send-address.component.css'],
})
export class AccountSendAddressComponent implements OnInit, OnDestroy {
  form: UntypedFormGroup;
  optionsOpen = false;
  amountTooLarge = false;
  hasSidechain = false;

  get optionAmountInput() {
    return this.form.get('amountInput') as UntypedFormControl;
  }

  get optionFeeInput() {
    return this.form.get('feeInput') as UntypedFormControl;
  }

  constructor(
    public uiState: UIState,
    public sendService: SendService,
    private paymentRequest: PaymentRequest,
    public walletManager: WalletManager,
    public networkStatusService: NetworkStatusService,
    private addressValidation: AddressValidationService,
    private ngZone: NgZone,
    public dialog: MatDialog,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    public translate: TranslateService
  ) {
    this.form = fb.group({
      addressInput: new UntypedFormControl('', [Validators.required, Validators.minLength(6), InputValidators.address(this.sendService, this.addressValidation)]),
      changeAddressInput: new UntypedFormControl('', [InputValidators.address(this.sendService, this.addressValidation)]),
      memoInput: new UntypedFormControl(''),
      amountInput: new UntypedFormControl('', [Validators.required, Validators.min(0), Validators.pattern(/^-?(0|[0-9]+[.]?[0-9]*)?$/), InputValidators.maximumBitcoin(sendService)]),
      // TODO: Make an custom validator that sets form error when fee input is too low.
      feeInput: new UntypedFormControl(this.sendService.getNetworkFee(), [Validators.required, Validators.min(0), Validators.pattern(/^-?(0|[0-9]+[.]?[0-9]*)?$/)]),
    });

    this.optionFeeInput.valueChanges.subscribe((value) => {
      this.sendService.fee = value;
      this.optionAmountInput.updateValueAndValidity();
      this.optionAmountInput.markAsTouched();
    });

    const networkStatus = this.networkStatusService.get(this.sendService.network.id);

    if (networkStatus.length == 0) {
      this.sendService.feeRate = this.sendService.network.feeRate;
    } else {
      this.sendService.feeRate = networkStatus[0].relayFee;
    }

    this.hasSidechain = this.sendService.network.sidechains != null;
  }

  ngOnDestroy() { }

  async ngOnInit() { }

  scanQrCode() {
    const dialogRef = this.dialog.open(QrScanDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.sendService.address = result;
    });
  }

  async paste() {
    try {
      const options: any = { name: 'clipboard-read', allowWithoutGesture: false };
      const permission = await navigator.permissions.query(options);

      if (permission.state === 'denied') {
        throw new Error(await this.translate.get('Account.NotAllowedToReadClipboard').toPromise());
      }

      const clipboardContents = await navigator.clipboard.readText();

      if (clipboardContents) {
        if (clipboardContents.indexOf(':') > -1) {
          // web+pay://city:CHq57DhZpeVzZTxSJJTpnpMU68Ec8MGfiB?amount=1&label=2&message=3&data=5&id=4
          const payment = this.paymentRequest.decode(this.paymentRequest.removeHandler(clipboardContents));
          this.sendService.address = payment.address;
          this.sendService.amount = payment.options.amount;
          this.sendService.payment = payment;

          // Alert, but continue:
          if (this.sendService.network.symbol.toUpperCase() != payment.network.toUpperCase()) {
            this.snackBar.open(`${await this.translate.get('Account.PaymentRequestIsMadeForAnotherNetwork').toPromise()} ${payment.network.toUpperCase()}`, await this.translate.get('Account.PaymentRequestIsMadeForAnotherNetworkAction').toPromise(), {
              duration: 6000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            });
          }
        } else {
          this.sendService.address = clipboardContents;
        }
      }
    } catch (error) {
      console.log(await this.translate.get('Account.UnableToGetClipboardPermissions').toPromise());
      console.error(error);
    }
  }

  fillMax(amount?: number) {
    this.sendService.setMax(new Big(amount));
  }

  toggleOptions() {
    this.optionsOpen = !this.optionsOpen;
  }

  async getErrorMessage() {
    if (this.form.get('addressInput').hasError('required')) {
      return await this.translate.get('Account.YouMustEnterValue').toPromise();
    }

    return this.form.get('addressInput').hasError('email') ? await this.translate.get('Account.NotValidEmail').toPromise(): '';
  }
}
