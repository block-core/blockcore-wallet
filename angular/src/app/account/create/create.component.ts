import { Component, Inject, HostBinding, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UIState, CryptoService, CommunicationService, IconService, NetworksService, WalletManager } from '../../services';
import { Account } from '../../../shared/interfaces';
import { Router } from '@angular/router';
import { Network } from '../../../shared/networks';
const { v4: uuidv4 } = require('uuid');

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
    network = '';
    indexes: number[] = [];
    index: number = 0;
    derivationPath!: string;
    name = 'New account';
    sub: any;
    icon: string | undefined;
    selectedNetwork: Network;

    get passwordValidated(): boolean {
        return this.password === this.password2 && this.secondFormGroup.valid;
    }

    constructor(private _formBuilder: FormBuilder,
        public uiState: UIState,
        private crypto: CryptoService,
        private router: Router,
        public icons: IconService,
        public networkService: NetworksService,
        private communication: CommunicationService,
        public walletManager: WalletManager,
        private cd: ChangeDetectorRef
    ) {
        this.uiState.title = 'Create new account';
        this.icon = icons.default;

        for (let i = 0; i < 100; i++) {
            this.indexes.push(i);
        }

        this.uiState.showBackButton = true;

        // Default to the first available network.
        this.network = this.networkService.networks[0].id;

        this.onNetworkChanged();
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

        // this.sub = this.communication.listen('account-created', () => {
        //     if (this.walletManager.activeWallet) {
        //         const mostRecentAccount = this.walletManager.activeWallet.accounts[this.walletManager.activeWallet.accounts.length - 1];
        //         this.router.navigateByUrl('/account/view/' + mostRecentAccount.identifier);
        //     }
        // });
    }

    ngOnDestroy(): void {
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
        const derivationPath = this.networkService.getDerivationPathForNetwork(this.selectedNetwork);
        return `${derivationPath}/${this.index.toString()}'`;
    }

    onNetworkChanged() {
        this.selectedNetwork = this.networkService.getNetwork(this.network);
        this.derivationPath = this.getDerivationPath();
    }

    async onAccountIndexChanged(event: any) {
        // this.index = event.value;
        this.derivationPath = this.getDerivationPath();
    }

    async create() {
        // const splittedPath = this.derivationPath.split('/');
        const splittedPathReplaced = this.derivationPath.replaceAll(`'`, ``).split('/');

        const parsedPurpose = Number(splittedPathReplaced[1]);
        const parsedNetwork = Number(splittedPathReplaced[2]);
        const parsedIndex = Number(splittedPathReplaced[3]);

        // TODO: Get the account index from the derivation path if user customizes it.
        const account: Account = {
            identifier: uuidv4(),
            type: 'coin', // TODO: Change this depending on what user selects.
            networkType: this.selectedNetwork.id,
            name: this.name,
            index: parsedIndex,
            network: parsedNetwork,
            purpose: parsedPurpose,
            purposeAddress: parsedPurpose, // Until we have UI for selecting override, simply replicate the purpose from input.
            icon: this.icon,
            state: {
                balance: 0,
                change: [],
                receive: [],
                retrieved: null
            }
        };

        // Don't persist the selected value.
        delete account.selected;
        await this.walletManager.addAccount(account, this.walletManager.activeWallet);

        // When adding an account, the active account ID will be updated so we can read it here.
        this.router.navigateByUrl('/account/view/' + this.walletManager.activeAccountId);

        // this.communication.sendToAll('account-created');
        // this.manager.createAccount(this.uiState.activeWallet.id, account);

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
