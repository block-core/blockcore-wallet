import { Component, Inject, HostBinding, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UIState, CryptoService, WalletManager, CommunicationService, IconService } from '../../services';
import { Account, Vault } from '../../interfaces';
import { Router } from '@angular/router';

@Component({
    selector: 'app-vault-create',
    templateUrl: './create.component.html',
    styleUrls: ['../vault.component.css']
})
export class VaultCreateComponent implements OnInit, OnDestroy {
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
    name = 'New vault';
    sub: any;
    icon: string | undefined;
    selectedAccountIndex!: number;

    vault: Vault = {
        id: '',
        controller: '',
        sequence: -1,
        invoker: '',
        delegator: ''
    }

    get passwordValidated(): boolean {
        return this.password === this.password2 && this.secondFormGroup.valid;
    }

    constructor(private _formBuilder: FormBuilder,
        public uiState: UIState,
        private crypto: CryptoService,
        private router: Router,
        public icons: IconService,
        private communication: CommunicationService,
        public walletManager: WalletManager,
        private cd: ChangeDetectorRef
    ) {
        this.uiState.title = 'Create new vault';
        this.icon = icons.default;

        for (let i = 0; i < 100; i++) {
            this.indexes.push(i);
        }

        this.uiState.showBackButton = true;
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
            if (this.walletManager.activeWallet) {
                const mostRecentAccount = this.walletManager.activeWallet.accounts[this.walletManager.activeWallet.accounts.length - 1];
                this.router.navigateByUrl('/account/view/' + mostRecentAccount.identifier);
            }
        });
    }

    ngOnDestroy(): void {
        this.communication.unlisten(this.sub);
    }

    async onWalletChanged(event: any) {
        // const walletId = event.value;
        console.log(event.value);
        console.log('selectedAccountIndex:' + this.selectedAccountIndex);

        this.vault.controller = this.walletManager.activeWallet?.accounts[this.selectedAccountIndex].identifier;

        this.generate();
    }

    async generate() {
        // TODO: We must get the derived public key from the key at the seleted index. Currently we'll just put the
        // index, but this must be changed to public key or anyone can generate vault names that belong to the identifier.
        const getPublicKeyForIdentityIndex = this.index;

        const text = `${this.vault.controller}#${getPublicKeyForIdentityIndex}`;
        const digestHex = await this.digestMessage(text);
        console.log(digestHex);
        this.vault.id = digestHex;
    }

    async digestMessage(message: string) {
        const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
        const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
        return hashHex;
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

        this.generate();
    }

    create() {
        // this.manager.createVault(this.vault);

        // const splittedPath = this.derivationPath.split('/');
        // const splittedPathReplaced = this.derivationPath.replaceAll(`'`, ``).split('/');

        // const parsedPurpose = Number(splittedPathReplaced[1]);
        // const parsedNetwork = Number(splittedPathReplaced[2]);
        // const parsedIndex = Number(splittedPathReplaced[3]);

        // // TODO: Get the account index from the derivation path if user customizes it.
        // const account: Account = {
        //     name: this.name,
        //     index: parsedIndex,
        //     network: parsedNetwork,
        //     purpose: parsedPurpose,
        //     derivationPath: this.derivationPath,
        //     icon: this.icon
        // };

        // this.manager.createAccount(account);

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
