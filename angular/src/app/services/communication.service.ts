import { Injectable, NgZone } from '@angular/core';
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
        private logger: LoggerService,
        private env: EnvironmentService) {

    }

    initialize() {
        // TODO: Handle these messages internally when running outside of extension context.
        if (this.runtime.isExtension) {
            chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
                const result = await this.handleInternalMessage(message, sender);
                this.logger.debug(`Process messaged ${message.type} and returning this response: `, result);
                sendResponse(result);
            });

            chrome.runtime.onMessageExternal.addListener(async (message, sender, sendResponse) => {
                const result = await this.handleExternalMessage(message, sender);
                this.logger.debug(`Process (external) messaged ${message.type} and returning this response: `, result);
                sendResponse(result);
            });
        } else {
            this.events.subscribeAll().subscribe(async (message) => {
                // Compared to the extension based messaging, we don't have response messages.
                this.logger.debug(`Process message:`, message);
                await this.handleMessage(message.data);
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
        console.log('CommunicationService::send:', message);

        // this.runtime.sendMessage(message, (response) => {
        //     console.log('CommunicationService:send:response:', response);
        // });

        if (this.runtime.isExtension) {
            chrome.runtime.sendMessage(message, (response) => {
                console.log('CommunicationService:send:response:', response);
            });
        } else {
            this.events.publish(message.type, message);
        }
    }

    /** Send message to every single instance of the extension. */
    sendToTabs(message: Message) {
        chrome.tabs.query({}, (tabs) => tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, message)));
    }

    async handleMessage(message: Message) {
        console.log('CommunicationService:onMessage: ', message);

        if (message.target !== 'tabs') {
            console.log('This message is not handled by the tabs (extension) logic.');
            return null;
        }

        try {
            switch (message.type) {
                case 'getpublickey': {
                    return '545555';
                }
                case 'login': {
                    return 'success';
                }
                case 'updated': {
                    console.log('SERVICE WORKER HAS FINISHED INDEXING, but no changes to the data, but we get updated wallet info.', message.data);
                    this.state.update();
                    return 'ok';
                }
                case 'indexed': {
                    console.log('SERVICE WORKER HAS FINISHED INDEXING!!! WE MUST RELOAD STORES!', message.data);
                    this.state.refresh();
                    return 'ok';
                }
                case 'reload': {
                    console.log('Wallet / Account might be deleted, so we must reload state.');
                    this.state.reload();
                    return 'ok';
                }
                case 'store-reload': {
                    console.log(`Specific store was requested to be updated: ${message.data}`);
                    this.state.reloadStore(message.data);

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
                    return null;
                }
                default:
                    console.log(`The message type ${message.type} is not known.`);
                    return null;
            }
        } catch (error: any) {
            return { error: { message: error.message, stack: error.stack } }
        }

        // this.ngZone.run(async () => {
        // });
    }

    async handleInternalMessage(message: Message, sender: chrome.runtime.MessageSender) {
        console.log('CommunicationService:onMessage: ', message);
        console.log('CommunicationService:onMessage:sender: ', sender);

        if (message.target !== 'tabs') {
            console.log('This message is not handled by the tabs (extension) logic.');
            return null;
        }

        try {
            switch (message.type) {
                case 'getpublickey': {
                    return '545555';
                }
                case 'login': {
                    return 'success';
                }
                case 'updated': {
                    console.log('SERVICE WORKER HAS FINISHED INDEXING, but no changes to the data, but we get updated wallet info.', message.data);
                    this.state.update();
                    return 'ok';
                }
                case 'indexed': {
                    console.log('SERVICE WORKER HAS FINISHED INDEXING!!! WE MUST RELOAD STORES!', message.data);
                    this.state.refresh();
                    return 'ok';
                }
                case 'reload': {
                    console.log('Wallet / Account might be deleted, so we must reload state.');
                    this.state.reload();
                    return 'ok';
                }
                case 'store-reload': {
                    console.log(`Specific store was requested to be updated: ${message.data}`);
                    this.state.reloadStore(message.data);

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
                    return null;
                }
                default:
                    console.log(`The message type ${message.type} is not known.`);
                    return null;
            }
        } catch (error: any) {
            return { error: { message: error.message, stack: error.stack } }
        }

        // this.ngZone.run(async () => {
        // });
    }

    async handleExternalMessage(message: any, sender: chrome.runtime.MessageSender) {
        console.log('CommunicationService:onMessageExternal: ', message);
        console.log('CommunicationService:onMessageExternal:sender: ', sender);

        switch (message.event) {
            case "index:done":
                return this.createResponse(message);
                break;
            default:
                return null;
                break;
        }

        // this.ngZone.run(async () => {
        //     switch (message.event) {
        //         case "unknown":
        //             break;
        //         default:
        //             console.warn(`Unhandled (external) message type: ${message.event}`);
        //     }
        // });
    }
}


// @Injectable({
//     providedIn: 'root'
// })
// export class CommunicationService2 {
//     private port!: chrome.runtime.Port | null;
//     // consumers: { [name: string]: any } = {};
//     // consumers: Record<string, any> = {};
//     private consumers = new Map<string, any[]>();

//     constructor(private ngZone: NgZone) {
//         if (globalThis.chrome && globalThis.chrome.runtime) {
//             this.port = chrome.runtime.connect({ name: 'extension-channel' });

//             this.port.onDisconnect.addListener(d => {
//                 console.warn('We have disconnected the Port with background process.');
//                 this.port = null;
//             });

//             this.port.onMessage.addListener(message => {
//                 console.log('UI:onMessage:', message);

//                 if (!message.method) {
//                     return;
//                 }

//                 // TODO: Do we want to and need to protect ourself by verifying method and data structures?
//                 // As a minimum, we'll serialize to JSON and back to Object.
//                 // UPDATE: JSON serialization was removed since it destroyed the "Map" object instances.
//                 const data = message.data; // message.data ? JSON.parse(JSON.stringify(message.data)) : undefined;
//                 const method = message.method; // JSON.parse(JSON.stringify(message.method));

//                 this.trigger(method, data);
//             });
//         }
//     }

//     private trigger(method: string, data: any) {
//         console.log('UI:trigger:', method);

//         if (!this.consumers.has(method)) {
//             console.log('There are zero consumers of:', method);
//             return;
//         }

//         var consumer = this.consumers.get(method);

//         // Enable this for debugging. If enabled, it will reveal in the log the secret recovery phrase when revealing it through settings.
//         // console.log('Forwarding data to consumers:', data);

//         // Make sure we execute the listeners in Angular Zone.
//         this.ngZone.run(() => {
//             consumer?.forEach((c) => {
//                 c.listener(data);
//             });
//         });
//     }

//     send(method: string, data?: any) {
//         console.log('UI:send:', method);
//         this.port?.postMessage({ method, data });
//     }

//     /** Add a listener to specific messages that is received in the app. Returns an subscription object that must be used to unlisten. */
//     listen(method: string, listener: any) {
//         let key = uuidv4();

//         if (!this.consumers.has(method)) {
//             this.consumers.set(method, [{ key, listener }]);
//         } else {
//             const consumer = this.consumers.get(method);
//             consumer?.push({ key, listener });
//         }

//         return { method, key };
//     }

//     /** Remove a listener to specific messages. */
//     unlisten(subscription: { method: string, key: string }) {
//         if (!this.consumers.has(subscription.method)) {
//             console.log('There are no consumers to unlisten to:', subscription);
//             return;
//         }

//         const consumer = this.consumers.get(subscription.method);

//         console.log('REMOVING LISTENER KEY:', subscription.key);
//         console.log(JSON.stringify(consumer));

//         const subscriber = consumer?.findIndex(c => c.key == subscription.key) as number;

//         console.log('Subscriber Index:', subscriber);

//         if (subscriber !== -1) {
//             consumer?.splice(subscriber, 1);
//         }

//         console.log(JSON.stringify(consumer));
//     }
// }
