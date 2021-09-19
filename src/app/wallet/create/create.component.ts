import { Component, Inject, HostBinding, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UIState } from '../../services/ui-state.service';
import { CryptoService } from '../../services/crypto.service';
import { CommunicationService } from 'src/app/services/communication.service';
import { Wallet } from 'src/app/interfaces';
import { copyToClipboard } from 'src/app/shared/utilities';
const { v4: uuidv4 } = require('uuid');

@Component({
    selector: 'app-wallet-create',
    templateUrl: './create.component.html',
    styleUrls: ['../wallet.component.css']
})
export class WalletCreateComponent implements OnInit {
    // TODO: Remove this hardcoded recovery phrase before release, used to easily restore test-wallet.
    mnemonic = 'cash way jazz spare mesh develop split art cat link kind flame';
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

    // copy() {
    //     var textArea = document.createElement("textarea") as any;

    //     // Place in the top-left corner of screen regardless of scroll position.
    //     textArea.style.position = 'fixed';
    //     textArea.style.top = 0;
    //     textArea.style.left = 0;

    //     // Ensure it has a small width and height. Setting to 1px / 1em
    //     // doesn't work as this gives a negative w/h on some browsers.
    //     textArea.style.width = '2em';
    //     textArea.style.height = '2em';

    //     // We don't need padding, reducing the size if it does flash render.
    //     textArea.style.padding = 0;

    //     // Clean up any borders.
    //     textArea.style.border = 'none';
    //     textArea.style.outline = 'none';
    //     textArea.style.boxShadow = 'none';

    //     // Avoid flash of the white box if rendered for any reason.
    //     textArea.style.background = 'transparent';

    //     textArea.value = this.mnemonic;

    //     console.log(`${this.mnemonic}`);
    //     console.log(`${textArea.value}`);

    //     document.body.appendChild(textArea);
    //     textArea.focus();
    //     textArea.select();

    //     try {
    //         var successful = document.execCommand('copy');
    //         var msg = successful ? 'successful' : 'unsuccessful';
    //         console.log('Copying text command was ' + msg);
    //     } catch (err) {
    //         console.log('Oops, unable to copy');
    //     }

    //     document.body.removeChild(textArea);
    // }

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
            var wallet: Wallet = {
                id: id,
                name: 'Wallet ' + (this.uiState.persisted.wallets.length + 1),
                mnemonic: recoveryPhrase,
                activeAccountIndex: 0,
                accounts: [
                    {
                        index: 0,
                        name: 'Identity',
                        network: 616,
                        purpose: 302,
                        derivationPath: `m/302'/616'/0'`,
                        icon: 'account_circle'
                    }
                ]
            };

            this.communication.send('wallet-create', wallet);

            // Make the newly created wallet the selected one.
            // this.uiState.persisted.activeWalletId = id;

            // this.communication.send('set-active-wallet-index', walletIndex);

            // this.appState.persisted.wallets.push({
            //     name: 'Wallet ' + (this.appState.persisted.wallets.length + 1),
            //     mnemonic: recoveryPhrase,
            //     accounts: [
            //         {
            //             index: 0,
            //             name: 'Identity',
            //             network: 616,
            //             purpose: 302,
            //             derivationPath: `302'/616'`
            //         }
            //     ]
            // });

            // Persist the state.
            // await this.appState.save();
        }
    }
}
