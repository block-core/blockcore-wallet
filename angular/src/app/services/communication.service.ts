import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { EnvironmentService, SettingsService } from '.';
import { Message, MessageResponse } from '../../shared/interfaces';
import { EventBus } from './event-bus';
import { LoggerService } from './logger.service';
import { RuntimeService } from './runtime.service';
import { StateService } from './state.service';
const { v4: uuidv4 } = require('uuid');

@Injectable({
    providedIn: 'root'
})
export class CommunicationService {
    constructor(
        private ngZone: NgZone,
        private state: StateService,
        private settings: SettingsService,
        private runtime: RuntimeService,
        private events: EventBus,
        private router: Router,
        private logger: LoggerService,
        private env: EnvironmentService) {

    }

    initialize() {
        // TODO: Handle these messages internally when running outside of extension context.
        if (this.runtime.isExtension) {



            // chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

            //     console.log('chrome.runtime.onMessage within ANGULAR!');



            //     this.ngZone.run(async () => {
            //         const result = await this.handleInternalMessage(message, sender);
            //         // this.logger.debug(`Process messaged ${message.type} and returning this response: `, result);
            //         sendResponse(result);
            //     });
            // });

            // chrome.runtime.onMessageExternal.addListener(async (message, sender, sendResponse) => {

            //     console.log('chrome.runtime.onMessageExternal 2222 within ANGULAR!');

            //     this.ngZone.run(async () => {
            //         const result = await this.handleExternalMessage(message, sender);
            //         // this.logger.debug(`Process (external) messaged ${message.type} and returning this response: `, result);
            //         sendResponse(result);
            //     });
            // });
        } else {
            this.events.subscribeAll().subscribe(async (message) => {
                this.ngZone.run(async () => {
                    // Compared to the extension based messaging, we don't have response messages.
                    // this.logger.debug(`Process message:`, message);
                    await this.handleMessage(message.data);
                });
            });
        }
    }

    createMessage(type: string, data?: any, target: string = 'background'): Message {
        let key = uuidv4();


        return {
            id: key,
            type: type,
            data: data,
            ext: this.env.instance,
            source: 'tabs',
            target: target
        }
        
    }

    createResponse(message: Message, data?: any): MessageResponse {
        const clonedMessage = { ...message };
        clonedMessage.data = data;

        return clonedMessage;
    }

    /** Send message to the background service. */
    send(message: Message) {
        // this.logger.info('CommunicationService::send:', message);

        if (this.runtime.isExtension) {
            // chrome.runtime.sendMessage(message, (response) => {
            //     // this.logger.info('CommunicationService:send:response:', response);
            // });
            
        } else {
            this.events.publish(message.type, message);
        }
    }

    /** Send message to every single instance of the extension. */
    sendToTabs(message: Message) {
        // chrome.tabs.query({}, (tabs) => tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, message)));
    }

    async handleMessage(message: Message) {
        // this.logger.info('CommunicationService:onMessage: ', message);

        // if (message.target !== 'tabs') {
        //     console.log('This message is not handled by the tabs (extension) logic.');
        //     return null;
        // }

        try {
            switch (message.type) {
                case 'publickey': {
                    return '22222';
                }
                case 'login': {
                    return 'success';
                }
                case 'updated': {
                    // console.log('SERVICE WORKER HAS FINISHED INDEXING, but no changes to the data, but we get updated wallet info.', message.data);
                    await this.state.update();
                    return 'ok';
                }
                case 'indexed': {
                    // console.log('SERVICE WORKER HAS FINISHED INDEXING!!! WE MUST RELOAD STORES!', message.data);
                    await this.state.refresh();
                    return 'ok';
                }
                case 'reload': {
                    // console.log('Wallet / Account might be deleted, so we must reload state.');
                    await this.state.reload();
                    return 'ok';
                }
                case 'network-updated': {
                    // console.log('Network status was updated, reload the networkstatus store!');
                    await this.state.reloadStore('networkstatus');
                    return 'ok';
                }
                case 'store-reload': {
                    console.log(`Specific store was requested to be updated: ${message.data}`);
                    await this.state.reloadStore(message.data);

                    if (message.data === 'setting') {
                        await this.settings.update();
                    }

                    return 'ok';
                }
                case 'timeout': {
                    // Timeout was reached in the background. There is already logic listening to the session storage
                    // that will reload state and redirect to home (unlock) if needed, so don't do that here. It will
                    // cause a race condition on loading new state if redirect is handled here.
                    console.log('Timeout was reached in the background service.');
                    this.router.navigateByUrl('/home');
                    return true;
                }
                default:
                    console.log(`The message type ${message.type} is not known.`);
                    return true;
            }
        } catch (error: any) {
            return { error: { message: error.message, stack: error.stack } }
        }

        return true;
    }

    async handleInternalMessage(message: Message, sender: chrome.runtime.MessageSender) {
        // this.logger.info('CommunicationService:onMessage: ', message);
        // this.logger.info('CommunicationService:onMessage:sender: ', sender);

        // if (message.target !== 'tabs') {
        //     console.log('This message is not handled by the tabs (extension) logic.');
        //     return null;
        // }

        try {
            switch (message.type) {
                case 'publickey': {
                    return '3333333';
                }
                case 'login': {
                    return 'success';
                }
                case 'updated': {
                    // console.log('SERVICE WORKER HAS FINISHED INDEXING, but no changes to the data, but we get updated wallet info.', message.data);
                    // await this.state.update();
                    await this.state.refresh();
                    return 'ok';
                }
                case 'indexed': {
                    // console.log('SERVICE WORKER HAS FINISHED INDEXING!!! WE MUST RELOAD STORES!', message.data);
                    await this.state.refresh();
                    return 'ok';
                }
                case 'reload': {
                    // console.log('Wallet / Account might be deleted, so we must reload state.');
                    await this.state.reload();
                    return 'ok';
                }
                case 'network-updated': {
                    // console.log('Network status was updated, reload the networkstatus store!');
                    await this.state.reloadStore('networkstatus');
                    return 'ok';
                }
                case 'store-reload': {
                    console.log(`Specific store was requested to be updated: ${message.data}`);
                    await this.state.reloadStore(message.data);

                    if (message.data === 'setting') {
                        await this.settings.update();
                    }

                    return 'ok';
                }
                case 'timeout': {
                    // Timeout was reached in the background. There is already logic listening to the session storage
                    // that will reload state and redirect to home (unlock) if needed, so don't do that here. It will
                    // cause a race condition on loading new state if redirect is handled here.
                    this.logger.info('Timeout was reached in the background service (handleInternalMessage).');
                    this.router.navigateByUrl('/home');
                    return null;
                }
                default:
                    this.logger.warn(`The message type ${message.type} is not known.`);
                    return null;
            }
        } catch (error: any) {
            return { error: { message: error.message, stack: error.stack } }
        }
    }

    async handleExternalMessage(message: any, sender: chrome.runtime.MessageSender) {
        this.logger.info('CommunicationService:onMessageExternal: ', message);
        this.logger.info('CommunicationService:onMessageExternal:sender: ', sender);

        switch (message.event) {
            case "index:done":
                return this.createResponse(message);
                break;
            default:
                return null;
                break;
        }
    }
}
