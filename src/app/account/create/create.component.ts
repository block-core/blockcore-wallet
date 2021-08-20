import { Component, Inject, HostBinding, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UIState } from '../../services/ui-state.service';
import { CryptoService } from '../../services/crypto.service';
import { Account } from 'src/app/interfaces';
import { Router } from '@angular/router';
import { OrchestratorService } from 'src/app/services/orchestrator.service';
import { CommunicationService } from 'src/app/services/communication.service';
import { IconService } from 'src/app/services/icon.service';

@Component({
    selector: 'app-account-create',
    templateUrl: './create.component.html',
    styleUrls: ['../account.component.css']
})
export class AccountCreateComponent implements OnInit, OnDestroy {
    mnemonic = '';
    firstFormGroup!: FormGroup;
    secondFormGroup!: FormGroup;
    step = 0;
    recover = false;
    mnemonicInputDisabled = true;
    password = '';
    password2 = '';
    network = "302'/616'";
    indexes: number[] = [];
    index: number = 0;
    derivationPath!: string;
    name = 'New account';
    sub: any;
    icon: string | undefined;

    get passwordValidated(): boolean {
        return this.password === this.password2 && this.secondFormGroup.valid;
    }

    constructor(private _formBuilder: FormBuilder,
        public uiState: UIState,
        private crypto: CryptoService,
        private router: Router,
        public icons: IconService,
        private communication: CommunicationService,
        private manager: OrchestratorService,
        private cd: ChangeDetectorRef
    ) {
        this.uiState.title = 'Create new account';
        this.icon = icons.default;

        for (let i = 0; i < 100; i++) {
            this.indexes.push(i);
        }
    }

    ngOnInit() {
        this.firstFormGroup = this._formBuilder.group({
            // firstCtrl: ['', Validators.required]
        });

        this.secondFormGroup = this._formBuilder.group({
            passwordCtrl: ['', Validators.required],
            password2Ctrl: ['', Validators.required]
        });

        this.derivationPath = this.getDerivationPath();

        this.sub = this.communication.listen('account-created', () => {
            if (this.uiState.activeWallet) {
                this.router.navigateByUrl('/account/view/' + (this.uiState.activeWallet.accounts.length - 1));
            }
        });
    }

    ngOnDestroy(): void {
        this.communication.unlisten(this.sub);
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

    getDerivationPath() {
        return `m/${this.network.toString()}/${this.index.toString()}'`;
    }

    async onNetworkChanged(event: any) {
        // this.network = event.value;
        this.derivationPath = this.getDerivationPath();
    }

    async onAccountIndexChanged(event: any) {
        // this.index = event.value;
        this.derivationPath = this.getDerivationPath();
    }

    create() {
        const splittedPath = this.derivationPath.split('/');
        const splittedPathReplaced = this.derivationPath.replaceAll(`'`, ``).split('/');

        const parsedPurpose = Number(splittedPathReplaced[1]);
        const parsedNetwork = Number(splittedPathReplaced[2]);
        const parsedIndex = Number(splittedPathReplaced[3]);

        // TODO: Get the account index from the derivation path if user customizes it.
        const account: Account = {
            name: this.name,
            index: parsedIndex,
            network: parsedNetwork,
            purpose: parsedPurpose,
            derivationPath: this.derivationPath,
            icon: this.icon
        };

        this.manager.createAccount(account);

        // this.step = 1;
        // this.recover = false;
        // this.generate();

        // this.firstFormGroup = this._formBuilder.group({
        //     // firstCtrl: ['', Validators.required]
        // });
    }

    // restore() {
    //     this.step = 1;
    //     this.recover = true;

    //     this.firstFormGroup = this._formBuilder.group({
    //         firstCtrl: ['', Validators.required]
    //     });
    // }

    // async save() {
    //     let recoveryPhrase = await this.crypto.encryptData(this.mnemonic, this.password);

    //     if (!recoveryPhrase) {
    //         console.error('Fatal error, unable to encrypt recovery phrase!');
    //         alert('Fatal error, unable to encrypt recovery phrase!');
    //     }
    //     else {
    //         this.appState.persisted.wallets.push({
    //             name: 'Wallet ' + (this.appState.persisted.wallets.length + 1),
    //             // chains: ['identity', 'city'],
    //             mnemonic: recoveryPhrase,
    //             accounts: [
    //                 {
    //                     index: 0,
    //                     name: 'Identity',
    //                     network: 'profile',
    //                     derivationPath: `302'/616'`
    //                 }
    //             ]
    //         });

    //         // Make the newly created wallet the selected one.
    //         this.appState.persisted.activeWalletIndex = this.appState.persisted.wallets.length - 1;

    //         // Persist the state.
    //         await this.appState.save();
    //     }
    // }
}
