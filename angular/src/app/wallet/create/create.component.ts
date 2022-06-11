import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, UntypedFormBuilder, FormControl, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { UIState, FeatureService, WalletManager, CommunicationService, CryptoService } from '../../services';
import { Wallet } from '../../../shared/interfaces';
import { copyToClipboard } from '../../shared/utilities';
import { map, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Location } from '@angular/common'
const { v4: uuidv4 } = require('uuid');

@Component({
    selector: 'app-wallet-create',
    templateUrl: './create.component.html',
    styleUrls: ['../wallet.component.css']
})
export class WalletCreateComponent implements OnInit {
    mnemonic = '';
    firstFormGroup!: UntypedFormGroup;
    secondFormGroup!: UntypedFormGroup;
    step = 0;
    recover = false;
    mnemonicInputDisabled = true;
    password = '';
    password2 = '';
    showInstallDialog = true;
    wordlists: any;
    wordlist: string;
    optionsOpen = false;
    extensionWords = '';

    get passwordValidated(): boolean {
        return this.password === this.password2 && this.secondFormGroup.valid;
    }

    constructor(private _formBuilder: UntypedFormBuilder,
        public feature: FeatureService,
        public uiState: UIState,
        private crypto: CryptoService,
        public walletManager: WalletManager,
        private router: Router,
        private location: Location,
        private communication: CommunicationService,
        private cd: ChangeDetectorRef
    ) {
        this.uiState.title = 'Create new wallet';
    }

    ngOnInit() {
        this.wordlist = this.crypto.listname;
        this.wordlists = this.crypto.languages();

        this.firstFormGroup = this._formBuilder.group({
            extensionWordsCtrl: ['']
        });

        this.secondFormGroup = this._formBuilder.group({
            passwordCtrl: ['', Validators.required],
            password2Ctrl: ['', Validators.required]
        });

        globalThis.addEventListener('DOMContentLoaded', () => {
            let displayMode = 'browser tab';

            if (globalThis.matchMedia('(display-mode: standalone)').matches) {
                displayMode = 'standalone';
            }

            // Log launch display mode to analytics
            console.log('DISPLAY_MODE_LAUNCH:', displayMode);
        });
    }

    generate() {
        // this.mnemonic = this.crypto.generateMnemonic();
        this.mnemonic = this.crypto.generateMnemonic();
    }

    copy() {
        copyToClipboard(this.mnemonic);
    }

    toggleOptions() {
        this.optionsOpen = !this.optionsOpen;
    }

    create() {
        debugger;
        this.next(1);
        this.recover = false;
        this.generate();

        this.firstFormGroup = this._formBuilder.group({
            // firstCtrl: ['', Validators.required]
            extensionWordsCtrl: ['']
        });
    }

    onLanguageChanged(event: any) {
        this.crypto.setWordList(this.wordlist);

        if (!this.recover) {
            this.mnemonic = this.crypto.generateMnemonic(this.wordlist);
        } else {
            this.firstFormGroup.controls['firstCtrl'].updateValueAndValidity();
        }
    }

    restore() {
        this.step = 1;
        this.recover = true;
        this.firstFormGroup = this._formBuilder.group({
            extensionWordsCtrl: [''],
            firstCtrl: [
                null,
                [Validators.required],
                [WalletCreateComponent.validateMnemonic(this.crypto)]
            ],
        });
    }

    cancel() {
        this.location.back();
    }

    static validateMnemonic(crypto: CryptoService): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors> => {
            return crypto
                .validateMnemonic(control.value)
                .pipe(
                    map((result: boolean) =>
                        result ? null : { invalidmnemonic: true }
                    )
                );
        };
    }

    next(step: number) {
        this.step = step;
    }

    async save() {
        let recoveryPhraseCipher = await this.crypto.encryptData(this.mnemonic, this.password);
        let extensionWordsCipher = undefined;

        if (this.extensionWords != null && this.extensionWords != '') {
            extensionWordsCipher = await this.crypto.encryptData(this.extensionWords, this.password);
        }

        const id = uuidv4();

        if (!recoveryPhraseCipher) {
            console.error('Fatal error, unable to encrypt secret recovery phrase!');
            alert('Fatal error, unable to encrypt secret recovery phrase!');
        }
        else {
            // Make the name 'Wallet' for first wallet, append count on other wallets.
            let walletName = (this.walletManager.count() == 0) ? 'My Wallet' : 'Wallet ' + (this.walletManager.count() + 1);

            var wallet: Wallet = {
                restored: this.recover,
                id: id,
                name: walletName,
                mnemonic: recoveryPhraseCipher,
                extensionWords: extensionWordsCipher,
                accounts: []
            };

            await this.walletManager.addWallet(wallet);

            // Save the newly added wallet.
            await this.walletManager.save();
        }

        this.next(3);
    }
}
