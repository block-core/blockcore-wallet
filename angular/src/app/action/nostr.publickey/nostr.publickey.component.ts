import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService, UIState, NetworksService, AppManager, WalletManager } from '../../services';
import { Router } from '@angular/router';
import { ActionService } from 'src/app/services/action.service';
// import * as browser from 'webextension-polyfill';
import { ActionMessage, Permission } from 'src/shared';
import { PermissionStore } from 'src/shared/store/permission-store';
import { Actions, PERMISSIONS } from 'src/app/shared/constants';
const { v4: uuidv4 } = require('uuid');

@Component({
  selector: 'app-nostr-publickey',
  templateUrl: './nostr.publickey.component.html',
  styleUrls: ['./nostr.publickey.component.css'],
})
export class ActionNostrPublicKeyComponent {
  constructor(
    public uiState: UIState,
    private permissionStore: PermissionStore,
    public actionService: ActionService,
    public networkService: NetworksService,
    public walletManager: WalletManager,
    private manager: AppManager,
    private cd: ChangeDetectorRef
  ) {
    // The content that is prepared for signing is normally an object, to render
    // this to the user, we'd want to make it a nice string if it's not an string.
    // if (typeof this.uiState.action.content !== 'string') {
    //   this.content = JSON.stringify(this.uiState.action.content, null, 2);
    // } else {
    //   this.content = this.uiState.action.content;
    // }

    const param = this.uiState.action.params[0];

    this.actionService.status.title = 'Share your Nostr identity (Public Key)';
    this.actionService.status.description = `Reason: "Site need access to your public key (identity)."`;

    this.actionService.consentType = 'regular';
    this.actionService.accountFilter = { types: ['identity'], symbol: ['nostr:key'] };
  }
}
