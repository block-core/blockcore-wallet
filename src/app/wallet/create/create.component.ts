import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UIState } from '../../services/ui-state.service';
import { CryptoService } from '../../services/crypto.service';
import { CommunicationService } from '../../services/communication.service';
import { Wallet } from '../../interfaces';
import { copyToClipboard } from '../../shared/utilities';
import { FeatureService } from '../../services/features.service';
const { v4: uuidv4 } = require('uuid');

@Component({
    selector: 'app-wallet-create',
    templateUrl: './create.component.html',
    styleUrls: ['../wallet.component.css']
})
export class WalletCreateComponent implements OnInit {
    mnemonic = '';
    firstFormGroup!: FormGroup;
    secondFormGroup!: FormGroup;
    step = 0;
    recover = false;
    mnemonicInputDisabled = true;
    password = '';
    password2 = '';

    get passwordValidated(): boolean {
        return this.password === this.password2 && this.secondFormGroup.valid;
    }

    constructor(private _formBuilder: FormBuilder,
        public feature: FeatureService,
        public uiState: UIState,
        private crypto: CryptoService,
        private communication: CommunicationService,
        private cd: ChangeDetectorRef
    ) {
        this.uiState.title = 'Create new wallet';
    }

    ngOnInit() {
        this.firstFormGroup = this._formBuilder.group({
            // firstCtrl: ['', Validators.required]
        });

        this.secondFormGroup = this._formBuilder.group({
            passwordCtrl: ['', Validators.required],
            password2Ctrl: ['', Validators.required]
        });
    }

    generate() {
        this.mnemonic = this.crypto.generateMnemonic();
    }

    copy() {
        copyToClipboard(this.mnemonic);
    }

    create() {
        this.step = 1;
        this.recover = false;
        this.generate();

        this.firstFormGroup = this._formBuilder.group({
            // firstCtrl: ['', Validators.required]
        });
    }

    restore() {
        this.step = 1;
        this.recover = true;

        this.firstFormGroup = this._formBuilder.group({
            firstCtrl: ['', Validators.required]
        });
    }

    async save() {
        let recoveryPhrase = await this.crypto.encryptData(this.mnemonic, this.password);
        const id = uuidv4();

        if (!recoveryPhrase) {
            console.error('Fatal error, unable to encrypt secret recovery phrase!');
            alert('Fatal error, unable to encrypt secret recovery phrase!');
        }
        else {
            // Make the name 'Wallet' for first wallet, append count on other wallets.
            let walletName = (this.uiState.persisted.wallets.length == 0) ? 'My Wallet' : 'Wallet ' + (this.uiState.persisted.wallets.length + 1);

            var wallet: Wallet = {
                restored: this.recover,
                id: id,
                name: walletName,
                mnemonic: recoveryPhrase,
                activeAccountId: null,
                accounts: []
            };

            this.communication.send('wallet-create', wallet);
        }
    }
}
