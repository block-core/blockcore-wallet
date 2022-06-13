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
        chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
          this.ngZone.run(async () => {
            const result = await this.handleExternalMessage(message, sender);
            // this.logger.debug(`Process messaged ${message.type} and returning this response: `, result);
            sendResponse(result);
          });
        });

        chrome.runtime.onMessageExternal.addListener(async (message, sender, sendResponse) => {
          this.ngZone.run(async () => {
            const result = await this.handleExternalMessage(message, sender);
            // this.logger.debug(`Process (external) messaged ${message.type} and returning this response: `, result);
            sendResponse(result);
          });
        });
      }
    }

  getNetwork(networkType: string) {
    return this.allNetworks.find(w => w.id == networkType);
  }


  async handleExternalMessage(message: Message, sender: chrome.runtime.MessageSender) {

        try {
            switch (message.type) {
              case 'ext:getpublickey': {

                if (this.walletManager.activeWallet != null) {
                  if (this.walletManager.activeAccount != null) {
                    const account = this.walletManager.activeAccount;
                    const network = this.getNetwork(account.networkType);
                    const accountNode = HDKey.fromExtendedKey(account.xpub, network.bip32);

                    return accountNode.publicKey;
                  }
                }
                return null;
                }
              case 'ext:login': {
                return this.walletManager.unlocked;
                }
                default:
                    this.logger.warn(`The message type ${message.type} is not known.`);
                    return null;
            }
        } catch (error: any) {
            return { error: { message: error.message, stack: error.stack } }
        }
    }
}
