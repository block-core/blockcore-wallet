// OrchestratorService
// Responsible for orchestrating events and processing when running in browser/mobile mode.

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Message } from 'src/shared';
import { SharedManager } from 'src/shared/shared-manager';
import { EventBus } from './event-bus';
import { LoggerService } from './logger.service';
import { WalletManager } from './wallet-manager';

@Injectable({
    providedIn: 'root'
})
export class OrchestratorService {
    private _initialized = false;
    private shared;

    constructor(
        private logger: LoggerService,
        private events: EventBus,
        private walletManager: WalletManager,
        private router: Router,
    ) {
        this.shared = new SharedManager();
    }

    /** Initializes the Orchestrator Service responsible for events and processing in browser/mobile mode. Should only be called when running outside of extension context. */
    initialize() {
        if (this._initialized) {
            return;
        }

        this._initialized = true;

        this.logger.debug('OrchestratorService wiring up listeners.');

        this.events.subscribeAll().subscribe(async (message) => {
            // Compared to the extension based messaging, we don't have response messages.
            this.logger.debug(`Process message:`, message);
            await this.handleMessage(message.data);
        });

        setInterval(async () => {
            this.logger.debug('periodic interval called.');
            const becameUnlocked = await this.shared.checkLockTimeout();

            if (becameUnlocked) {
                const msg = this.events.createMessage('timeout');
                this.events.publish(msg.type, msg);
            }

        }, 60000); // 'periodic', 1 minute

        setInterval(() => {
            this.logger.debug('index interval called.');
        }, 60000 * 10); // 'index', 10 minute
    }

    async handleMessage(message: Message) {
        // this.logger.info('CommunicationService:onMessage: ', message);

        // if (message.target !== 'background') {
        //     console.log('This message is not handled by the orchestrator logic.');
        //     return null;
        // }

        try {
            switch (message.type) {
                case 'getpublickey': {
                    return '444444';
                }
                case 'watch': {
                    return 'success';
                }
                // case 'updated': {
                //     console.log('SERVICE WORKER HAS FINISHED INDEXING, but no changes to the data, but we get updated wallet info.', message.data);
                //     this.state.update();
                //     return 'ok';
                // }
                // case 'indexed': {
                //     console.log('SERVICE WORKER HAS FINISHED INDEXING!!! WE MUST RELOAD STORES!', message.data);
                //     this.state.refresh();
                //     return 'ok';
                // }
                // case 'reload': {
                //     console.log('Wallet / Account might be deleted, so we must reload state.');
                //     this.state.reload();
                //     return 'ok';
                // }
                // case 'store-reload': {
                //     console.log(`Specific store was requested to be updated: ${message.data}`);
                //     this.state.reloadStore(message.data);

                //     if (message.data === 'setting') {
                //         await this.settings.update();
                //     }

                //     return 'ok';
                // }
                case 'timeout': {
                    // Timeout was reached in the background. There is already logic listening to the session storage
                    // that will reload state and redirect to home (unlock) if needed, so don't do that here. It will
                    // cause a race condition on loading new state if redirect is handled here.
                    this.logger.info('Timeout was reached in the background service.');

                    if (this.walletManager.activeWallet) {
                        this.walletManager.lockWallet(this.walletManager.activeWallet.id);
                        this.router.navigateByUrl('/home');
                    }

                    return null;
                }
                default:
                    this.logger.warn(`The message type ${message.type} is not known.`);
                    return null;
            }
        } catch (error: any) {
            return { error: { message: error.message, stack: error.stack } }
        }

        return true;

        // this.ngZone.run(async () => {
        // });
    }
}
