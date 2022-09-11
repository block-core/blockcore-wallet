import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { UIState, CryptoService, IconService, NetworksService, WalletManager, NetworkStatusService } from '../../services';
import { Account } from '../../../shared/interfaces';
import { Router } from '@angular/router';
import { Network } from '../../../shared/networks';
import { MessageService } from 'src/shared';
const { v4: uuidv4 } = require('uuid');

@Component({
  selector: 'app-account-create',
  templateUrl: './create.component.html',
  styleUrls: ['../account.component.css'],
})
export class AccountCreateComponent implements OnInit, OnDestroy {
  mnemonic = '';
  firstFormGroup!: UntypedFormGroup;
  secondFormGroup!: UntypedFormGroup;
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
  mode: string = 'normal';
  addressMode: string = 'normal';
  purposeAddress: number = 44;

  get passwordValidated(): boolean {
    return this.password === this.password2 && this.secondFormGroup.valid;
  }

  constructor(
    private _formBuilder: UntypedFormBuilder,
    public uiState: UIState,
    private crypto: CryptoService,
    private router: Router,
    public icons: IconService,
    public networkService: NetworksService,
    private message: MessageService,
    public walletManager: WalletManager,
    private networkStatusService: NetworkStatusService,
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
      password2Ctrl: ['', Validators.required],
    });

    this.derivationPath = this.getDerivationPath();
  }

  ngOnDestroy(): void {}

  generate() {
    this.mnemonic = this.crypto.generateMnemonic();
  }

  copy() {
    var textArea = document.createElement('textarea') as any;

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

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
    } catch (err) {
      console.error('Oops, unable to copy');
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
    this.purposeAddress = this.selectedNetwork.purposeAddress ?? 44;
  }

  async onAccountIndexChanged(event: any) {
    // this.index = event.value;
    this.derivationPath = this.getDerivationPath();
  }

  async create() {
    const splittedPathReplaced = this.derivationPath.replaceAll(`'`, ``).split('/');

    const parsedPurpose = Number(splittedPathReplaced[1]);
    const parsedNetwork = Number(splittedPathReplaced[2]);
    const parsedIndex = Number(splittedPathReplaced[3]);
    const accountType = this.selectedNetwork.purpose == 302 ? 'identity' : 'coin';

    // Read the purpose address from UI selection:
    let selectedPurposeAddress = this.purposeAddress;

    if (accountType == 'identity') {
      selectedPurposeAddress = 340;
    }

    // TODO: Get the account index from the derivation path if user customizes it.
    const account: Account = {
      identifier: uuidv4(),
      type: accountType,
      mode: this.mode,
      singleAddress: this.addressMode === 'single',
      networkType: this.selectedNetwork.id,
      name: this.name,
      index: parsedIndex,
      network: parsedNetwork,
      purpose: parsedPurpose,
      purposeAddress: selectedPurposeAddress,
      icon: this.icon,
    };

    // Don't persist the selected value.
    delete account.selected;
    await this.walletManager.addAccount(account, this.walletManager.activeWallet);

    // Make sure we get a recent state of the network user added account on. If this is the first time the user have added
    // account from this network, this will ensure that we have a status as early as possible.
    this.message.send(this.message.createMessage('network', { accounts: [account] }));
    // await this.networkStatusService.updateAll([account]); // TODO: This should perhaps not send single account, but all accounts.

    if (account.type == 'identity') {
      // When adding an account, the active account ID will be updated so we can read it here.
      this.router.navigateByUrl('/account/identity/' + this.walletManager.activeAccountId);
    } else {
      // When adding an account, the active account ID will be updated so we can read it here.
      this.router.navigateByUrl('/account/view/' + this.walletManager.activeAccountId);
    }
  }
}
