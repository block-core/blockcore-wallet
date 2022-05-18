import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import Big from 'big.js';
import { SATOSHI_FACTOR } from 'src/app/shared/constants';
import { WalletManager, UIState, SendService, NetworkStatusService } from '../../../services';

@Component({
    selector: 'app-account-send-address',
    templateUrl: './send-address.component.html',
    styleUrls: ['./send-address.component.css']
})
export class AccountSendAddressComponent implements OnInit, OnDestroy {

    // addressInput = new FormControl('', [Validators.required, Validators.email]);
    // amountInput = new FormControl('', [Validators.required, Validators.email]);
    // feeInput = new FormControl('', [Validators.required, Validators.email]);

    // form: FormGroup = new FormGroup({
    //     addressInput: new FormControl('', [Validators.required, Validators.email]),
    //     amountInput: new FormControl('', [Validators.required]),
    //     feeInput: new FormControl('', [Validators.required])
    // });

    // parts: FormGroup;

    form: FormGroup;
    optionsOpen = false;
    // feeRate = 0;

    // hideRequiredControl = new FormControl(false);
    // floatLabelControl = new FormControl('auto');

    constructor(
        public uiState: UIState,
        public sendService: SendService,
        public walletManager: WalletManager,
        public networkStatusService: NetworkStatusService,
        private fb: FormBuilder) {

        this.form = fb.group({
            addressInput: new FormControl('', [Validators.required, Validators.minLength(6)]),
            changeAddressInput: new FormControl('', []),
            // min(0) will ensure negative values is not allowed.
            amountInput: new FormControl('', [Validators.required, Validators.min(0), Validators.pattern(/^-?(0|[0-9]+[.]?[0-9]*)?$/)]),

            // TODO: Make an custom validator that sets form error when fee input is too low.
            feeInput: new FormControl(this.sendService.getNetworkFee(), [Validators.required, Validators.min(0), Validators.pattern(/^-?(0|[0-9]+[.]?[0-9]*)?$/)])
        });

        const networkStatus = this.networkStatusService.get(this.sendService.network.id);
        console.log('networkStatus:', networkStatus);
        this.sendService.feeRate = networkStatus.relayFee;
        // this.feeRate = networkStatus.relayFee;

        // this.parts = fb.group({
        //     area: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
        //     exchange: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
        //     subscriber: [null, [Validators.required, Validators.minLength(4), Validators.maxLength(4)]],
        // });
    }

    // get firstFormGroupControls() {
    //     return this.form.get('firstFormGroup')['controls'];
    // }

    ngOnDestroy() {

    }

    async ngOnInit() {
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