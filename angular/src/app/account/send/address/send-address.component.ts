import { Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import Big from 'big.js';
import { InputValidators } from 'src/app/services/inputvalidators';
import { SATOSHI_FACTOR } from 'src/app/shared/constants';
import { WalletManager, UIState, SendService, NetworkStatusService } from '../../../services';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { QrScanDialog } from './qr-scanning.component';

@Component({
    selector: 'app-account-send-address',
    templateUrl: './send-address.component.html',
    styleUrls: ['./send-address.component.css']
})
export class AccountSendAddressComponent implements OnInit, OnDestroy {
    form: FormGroup;
    optionsOpen = false;
    amountTooLarge = false;

    get optionAmountInput() {
        return this.form.get('amountInput') as FormControl;
    }

    get optionFeeInput() {
        return this.form.get('feeInput') as FormControl;
    }

    constructor(
        public uiState: UIState,
        public sendService: SendService,
        public walletManager: WalletManager,
        public networkStatusService: NetworkStatusService,
        private ngZone: NgZone,
        public dialog: MatDialog,
        private fb: FormBuilder) {

        this.form = fb.group({
            addressInput: new FormControl('', [Validators.required, Validators.minLength(6)]),
            changeAddressInput: new FormControl('', []),
            amountInput: new FormControl('', [Validators.required, Validators.min(0), Validators.pattern(/^-?(0|[0-9]+[.]?[0-9]*)?$/), InputValidators.maximumBitcoin(sendService)]),
            // TODO: Make an custom validator that sets form error when fee input is too low.
            feeInput: new FormControl(this.sendService.getNetworkFee(), [Validators.required, Validators.min(0), Validators.pattern(/^-?(0|[0-9]+[.]?[0-9]*)?$/)])
        });

        this.optionFeeInput.valueChanges.subscribe(value => {
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
    }

    ngOnDestroy() {

    }

    async ngOnInit() {
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

        dialogRef.afterClosed().subscribe(result => {
            this.sendService.address = result;
        });
    }

    async paste() {
        try {
            const options: any = { name: 'clipboard-read' };
            const permission = await navigator.permissions.query(options);

            if (permission.state === 'denied') {
                throw new Error('Not allowed to read clipboard.');
            }

            const clipboardContents = await navigator.clipboard.readText();

            if (clipboardContents) {
                this.sendService.address = clipboardContents;
            }
        }
        catch (error) {
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
