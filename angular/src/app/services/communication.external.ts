import { HDKey } from '@scure/bip32';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { EnvironmentService, SettingsService } from '.';
import { Message, MessageResponse } from '../../shared/interfaces';
import { EventBus } from './event-bus';
import { LoggerService } from './logger.service';
import { RuntimeService } from './runtime.service';
import { StateService } from './state.service';
import { WalletManager } from './wallet-manager';
import { NetworkLoader } from '../../shared/network-loader';
import { Network } from '../../shared/networks';
const { v4: uuidv4 } = require('uuid');


@Injectable({
  providedIn: 'root'
})
export class CommunicationExternal {

  private allNetworks: Network[];

  constructor(
    public networkLoader: NetworkLoader,
    private ngZone: NgZone,
    private state: StateService,
    private settings: SettingsService,
    private runtime: RuntimeService,
    private events: EventBus,
    private router: Router,
    private logger: LoggerService,
    private env: EnvironmentService,
    private walletManager: WalletManager) {

    this.allNetworks = this.networkLoader.getAllNetworks();

  }

  initialize() {
    if (this.runtime.isExtension) {
      // chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      //   this.ngZone.run(async () => {
      //     const result = await this.handleExternalMessage(message, sender);
      //     if (result != null) {
      //       sendResponse(result);
      //     }
      //   });
      // });

      // chrome.runtime.onMessageExternal.addListener(async (message, sender, sendResponse) => {
      //   console.log('chrome.runtime.onMessageExternal within ANGULAR!');
      //   this.ngZone.run(async () => {
      //     const result = await this.handleExternalMessage(message, sender);
      //     if (result != null) {
      //       sendResponse(result);
      //     }
      //   });
      // });
    }
  }

  getNetwork(networkType: string) {
    return this.allNetworks.find(w => w.id == networkType);
  }


  async handleExternalMessage(message: Message, sender: chrome.runtime.MessageSender) {

    try {
      switch (message.type) {
        case 'ext-getpublickey': {

          const account = this.walletManager.activeAccount;

          if (account == undefined) {
            return "unlock-wallet";
          }

          const network = this.getNetwork(account.networkType);
          const accountNode = HDKey.fromExtendedKey(account.xpub, network.bip32);

          return accountNode.publicKey;
        }

        default:
          return null;
      }
    } catch (error: any) {
      return { error: { message: error.message, stack: error.stack } }
    }
  }
}
