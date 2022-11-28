import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import Big from 'big.js';
import { InputValidators } from 'src/app/services/inputvalidators';
import { WalletManager, UIState, SendSidechainService, SendService, NetworkStatusService } from '../../../services';
import { MatDialog } from '@angular/material/dialog';
import { AddressValidationService } from 'src/app/services/address-validation.service';
import { QrScanDialog } from '../../send/address/qr-scanning.component';

@Component({
  selector: 'app-account-send-address',
  templateUrl: './send-address.component.html',
  styleUrls: ['./send-address.component.css'],
})
export class AccountSendSidechainAddressComponent implements OnInit, OnDestroy {
  form: UntypedFormGroup;
  optionsOpen = false;
  amountTooLarge = false;

  get optionAmountInput() {
    return this.form.get('amountInput') as UntypedFormControl;
  }

  get optionFeeInput() {
    return this.form.get('feeInput') as UntypedFormControl;
  }

  confirmationMessage = '';

  constructor(
    public uiState: UIState,
    public sendService: SendService,
    public sendSidechainService: SendSidechainService,
    public walletManager: WalletManager,
    public networkStatusService: NetworkStatusService,
    private addressValidation: AddressValidationService,
    private ngZone: NgZone,
    public dialog: MatDialog,
    private fb: UntypedFormBuilder
  ) {}

  ngOnDestroy() {}

  async ngOnInit() {
    // Constructor of send.component.ts should have called resetFee() by now, which sets
    // the fee to network definition. Here we will attempt to get it from blockchain API.
    const networkStatus = this.networkStatusService.get(this.sendService.network.id);

    // Grab the fee rate either from network definition or from blockchain API status:
    if (networkStatus.length > 0) {
      this.sendService.targetFeeRate = networkStatus[0].relayFee;
    }

    this.form = this.fb.group({
      // addressInput: new UntypedFormControl('', [Validators.required, Validators.minLength(6), InputValidators.address(this.sendService, this.addressValidation)]),
      changeAddressInput: new UntypedFormControl('', [InputValidators.address(this.sendService, this.addressValidation)]),
      amountInput: new UntypedFormControl('', [Validators.required, Validators.min(1), Validators.pattern(/^-?(0|[0-9]+[.]?[0-9]*)?$/), InputValidators.maximumBitcoin(this.sendService)]),
      // TODO: Make an custom validator that sets form error when fee input is too low.
      feeInput: new UntypedFormControl(this.sendService.targetFeeRate, [Validators.required, Validators.min(this.sendService.targetFeeRate), Validators.pattern(/^-?(0|[0-9]+[.]?[0-9]*)?$/)]),
      sidechainFee: new UntypedFormControl ('true'),

      // TODO: validate the sidechain target address using the sidechain network
      sidechainAddressInput: new UntypedFormControl('', [InputValidators.addressSidechain(this.sendSidechainService, this.addressValidation)]),
    });

    if (this.sendService.amount == '0') {
      this.sendService.amount = '1';
    }

    this.optionFeeInput.valueChanges.subscribe((value) => {
      this.sendService.fee = value;
      this.optionAmountInput.updateValueAndValidity();
      this.optionAmountInput.markAsTouched();
    });

    this.optionAmountInput.valueChanges.subscribe((value) => {
      // Calculate the confirmation text when amount changes.
      if (!this.sendSidechainService.selectedSidechain || value == null || value == '') {
        this.confirmationMessage = '';
        return;
      }

      const sidechain = this.sendService.network.sidechains.find((s) => s.symbol == this.sendSidechainService.selectedSidechain);
      const amount = Big(value);
      const confirmation = sidechain.confirmations.find((c) => ((c.high && amount.lt(c.high)) || !c.high) && amount.gte(c.low));

      if (confirmation && confirmation.high) {
        this.confirmationMessage = `Amounts less than ${confirmation.high} clear in ${confirmation.count} confirmations`;
      } else if (confirmation) {
        this.confirmationMessage = `Amounts higher than ${confirmation.low} clear in ${confirmation.count} confirmations`;
      } else {
        this.confirmationMessage = '';
      }
    });

    // Select the first defined sidechain and trigger the changed event:
    this.sendSidechainService.selectedSidechain = this.sendService.network.sidechains[0].symbol;
    await this.onSidechainSelectChanged({ value: this.sendService.network.sidechains[0].symbol });
  }

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

  async onSidechainSelectChanged(event: any) {
    this.sendService.network.sidechains.forEach((sidechain) => {
      if (sidechain.symbol == event.value) {
        this.sendService.address = sidechain.peg.address;
        this.sendSidechainService.network = this.networkStatusService.getNetwork(sidechain.symbol);
      }
    });
  }

  async paste() {
    try {
      const options: any = { name: 'clipboard-read', allowWithoutGesture: false };
      const permission = await navigator.permissions.query(options);

      if (permission.state === 'denied') {
        throw new Error('Not allowed to read clipboard.');
      }

      const clipboardContents = await navigator.clipboard.readText();

      if (clipboardContents) {
        this.sendSidechainService.sidechainAddress = clipboardContents;
      }
    } catch (error) {
      console.error(error);
    }
  }

  fillMax(amount?: number) {
    this.sendService.setMax(new Big(amount));
  }

  toggleOptions() {
    this.optionsOpen = !this.optionsOpen;
  }

  getErrorMessage() {
    if (this.form.get('addressInput').hasError('required')) {
      return 'You must enter a value';
    }

    return this.form.get('addressInput').hasError('email') ? 'Not a valid email' : '';
  }
}
