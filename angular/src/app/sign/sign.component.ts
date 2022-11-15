import * as bitcoinMessage from 'bitcoinjs-message';
import { Component, Inject, HostBinding, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { UIState } from '../services/ui-state.service';
import { NetworksService, StateService, WalletManager } from '../services';
import { RuntimeService } from '../../shared/runtime.service';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Account, AccountState, AccountStateStore } from 'src/shared';
import { Network } from 'src/shared/networks';
import { HDKey } from '@scure/bip32';

@Component({
  selector: 'app-sign',
  templateUrl: './sign.component.html',
  styleUrls: ['./sign.component.css'],
})
export class SignComponent implements OnInit {
  signFormGroup!: UntypedFormGroup;
  accounts: Account[];
  subscription: any;
  addresses: any[];
  accountState: AccountState;

  constructor(
    private accountStateStore: AccountStateStore,
    public networkService: NetworksService,
    private location: Location,
    public uiState: UIState,
    private state: StateService,
    private runtime: RuntimeService,
    private fb: UntypedFormBuilder,
    private walletManager: WalletManager
  ) {
    this.uiState.title = 'Sign & Verify';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = true;
    this.signFormGroup = this.fb.group({ accountCtrl: ['From Russia with Love'], messageCtrl: ['From Russia with Love 2'], addressCtrl: [''], signatureCtrl: [''] });
    // Make sure we listen to active account changes to perform updated list of keys.
    // TODO: Figure out why subscribing to this on the prompt makes it trigger twice. Perhaps there is some code elsewhere that
    // needs fixing to avoid running the operation twice.
    this.subscription = this.walletManager.activeAccount$.subscribe((a) => {
      this.update();
    });
  }
  ngOnInit() {
    this.accounts = this.walletManager.activeWallet.accounts;
    this.signFormGroup.controls['accountCtrl'].setValue(this.walletManager.activeAccountId);
  }

  async sign() {
    const message = this.signFormGroup.controls['messageCtrl'].value;
    const signature = await this.walletManager.signData(this.walletManager.activeWallet, this.walletManager.activeAccount, this.signFormGroup.controls['addressCtrl'].value, message);
    this.signFormGroup.controls['signatureCtrl'].setValue(signature);
  }
  async onAccountChanged() {
    await this.walletManager.setActiveAccount(this.signFormGroup.controls['accountCtrl'].value);
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  update() {
    const account = this.walletManager.activeAccount;
    this.accountState = this.accountStateStore.get(account.identifier);

    if (account.singleAddress || account.type === 'identity') {
      const addressEntry = this.accountState.receive[0];
      let address = '';

      if (account.type === 'identity') {
        const network = this.networkService.getNetwork(account.networkType);
        address = `${network.symbol}:${addressEntry.address.substring(0, 4)}...${addressEntry.address.substring(addressEntry.address.length - 4)}`;
      } else {
        address = addressEntry.address;
      }

      this.addresses = [{ address: address, keyId: '0/0', key: addressEntry.address }];
    } else {
      const array1 = this.accountState.receive.map((r) => {
        return { address: `${r.address} (Receive: ${r.index})`, keyId: '0/' + r.index, key: r.address };
      });
      const array2 = this.accountState.change.map((r) => {
        return { address: `${r.address} (Change: ${r.index})`, keyId: '1/' + r.index, key: r.address };
      });
      this.addresses = [...array1, ...array2];
    }

    let keyIndex = 0;
    this.signFormGroup.controls['addressCtrl'].setValue(this.addresses[0].key);

    //this.action.keyId = this.addresses[keyIndex].keyId;
    //this.action.key = this.addresses[keyIndex].key;
  }
}
