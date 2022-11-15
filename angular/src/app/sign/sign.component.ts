import * as bitcoinMessage from 'bitcoinjs-message';
import { Component, Inject, HostBinding, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { UIState } from '../services/ui-state.service';
import { StateService, WalletManager } from '../services';
import { RuntimeService } from '../../shared/runtime.service';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { warn } from 'console';
import { Account } from 'src/shared';
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
  constructor(private location: Location, public uiState: UIState, private state: StateService, private runtime: RuntimeService, private fb: UntypedFormBuilder, private walletManager: WalletManager) {
    this.uiState.title = 'Sign & Verify';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = true;
    this.signFormGroup = this.fb.group({ accountCtrl: ['From Russia with Love'], messageCtrl: ['From Russia with Love 2'] });
  }
  ngOnInit() {
    this.accounts = this.walletManager.activeWallet.accounts;
    this.signFormGroup.controls['accountCtrl'].setValue (this.walletManager.activeAccountId);
  }
  signData(network: Network, node: HDKey, content: string) {
    var signature = bitcoinMessage.sign(content, Buffer.from(node.privateKey), true, network.messagePrefix);
    return signature.toString('base64');
  }
  sign() {
    const message = this.signFormGroup.controls['messageCtrl'].value;

    //const privateKey = null;
    const signature = this.signData(null, null, message);
  }
}
