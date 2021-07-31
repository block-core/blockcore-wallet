import { Component, Inject, HostBinding, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApplicationState } from '../services/application-state.service';
import { CryptoService } from '../services/crypto.service';

@Component({
    selector: 'app-account',
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
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
        public appState: ApplicationState,
        private crypto: CryptoService,
        private cd: ChangeDetectorRef
    ) { }

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
        var textArea = document.createElement("textarea") as any;

        // Place in the top-left corner of screen regardless of scroll position.
        textArea.style.position = 'fixed';
        textArea.style.top = 0;
        textArea.style.left = 0;

        // Ensure it has a small width and height. Setting to 1px / 1em
        // doesn't work as this gives a negative w/h on some browsers.
        textArea.style.width = '2em';
        textArea.style.height = '2em';

        // We don't need padding, reducing the size if it does flash render.
        textArea.style.padding = 0;

        // Clean up any borders.
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';

        // Avoid flash of the white box if rendered for any reason.
        textArea.style.background = 'transparent';

        textArea.value = this.mnemonic;

        console.log(`${this.mnemonic}`);
        console.log(`${textArea.value}`);

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            var successful = document.execCommand('copy');
            var msg = successful ? 'successful' : 'unsuccessful';
            console.log('Copying text command was ' + msg);
        } catch (err) {
            console.log('Oops, unable to copy');
        }

        document.body.removeChild(textArea);
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
        const recoveryPhrase = await this.crypto.encryptData(this.mnemonic, this.password);

        if (!recoveryPhrase) {
            console.error('Fatal error, unable to encrypt recovery phrase!');
            alert('Fatal error, unable to encrypt recovery phrase!');
        }
        else {
            this.appState.persisted.accounts.push({
                name: 'Wallet 1',
                chains: ['identity', 'city'],
                mnemonic: recoveryPhrase
            });

            // Persist the state.
            this.appState.save(null);
        }
    }
}
