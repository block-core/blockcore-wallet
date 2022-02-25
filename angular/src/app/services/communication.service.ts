import { Injectable, NgZone } from '@angular/core';
import { EnvironmentService } from '.';
import { Message, MessageResponse } from '../interfaces';
const { v4: uuidv4 } = require('uuid');

@Injectable({
    providedIn: 'root'
})
export class CommunicationService {
    constructor(private ngZone: NgZone, private env: EnvironmentService) {

    }

    initialize() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const response = this.handleInternalMessage(message, sender);

            if (response) {
                // sendResponse(response);
            }
        });

        chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
            const response = this.handleExternalMessage(message, sender);

            if (response) {
                // sendResponse(response);
            }
        });
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

        chrome.runtime.sendMessage(message, (response) => {
            console.log('CommunicationService:send:response:', response);
        });
    }

    /** Send message to every single instance of the extension. */
    sendToTabs(message: Message) {
        chrome.tabs.query({}, (tabs) => tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, message)));
    }

    handleInternalMessage(message: Message, sender: chrome.runtime.MessageSender): any {
        console.log('CommunicationService:onMessage: ', message);
        console.log('CommunicationService:onMessage:sender: ', sender);

        if (message.target !== 'tabs') {
            console.log('This message is not handled by the tabs (extension) logic.');
            return;
        }

        // Whenever the background process sends us tmeout, we know that wallets has been locked.
        if (message.type === 'timeout') {
            // Timeout was reached in the background. There is already logic listening to the session storage
            // that will reload state and redirect to home (unlock) if needed, so don't do that here. It will
            // cause a race condition on loading new state if redirect is handled here.
            console.log('Timeout was reached in the background service.');
        } else if (message.type === 'settings:saved') {
            return this.createResponse(message, null);
        } else {
            console.warn(`Unhandled (internal) message type: ${message.type}`);
        }

        // this.ngZone.run(async () => {
        // });
    }

    handleExternalMessage(message: any, sender: chrome.runtime.MessageSender): any {
        console.log('CommunicationService:onMessageExternal: ', message);
        console.log('CommunicationService:onMessageExternal:sender: ', sender);

        switch (message.event) {
            case "index:done":
                return this.createResponse(message);
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


@Injectable({
    providedIn: 'root'
})
export class CommunicationService2 {
    private port!: chrome.runtime.Port | null;
    // consumers: { [name: string]: any } = {};
    // consumers: Record<string, any> = {};
    private consumers = new Map<string, any[]>();

    constructor(private ngZone: NgZone) {
        if (globalThis.chrome && globalThis.chrome.runtime) {
            this.port = chrome.runtime.connect({ name: 'extension-channel' });

            this.port.onDisconnect.addListener(d => {
                console.warn('We have disconnected the Port with background process.');
                this.port = null;
            });

            this.port.onMessage.addListener(message => {
                console.log('UI:onMessage:', message);

                if (!message.method) {
                    return;
                }

                // TODO: Do we want to and need to protect ourself by verifying method and data structures?
                // As a minimum, we'll serialize to JSON and back to Object.
                // UPDATE: JSON serialization was removed since it destroyed the "Map" object instances.
                const data = message.data; // message.data ? JSON.parse(JSON.stringify(message.data)) : undefined;
                const method = message.method; // JSON.parse(JSON.stringify(message.method));

                this.trigger(method, data);
            });
        }
    }

    private trigger(method: string, data: any) {
        console.log('UI:trigger:', method);

        if (!this.consumers.has(method)) {
            console.log('There are zero consumers of:', method);
            return;
        }

        var consumer = this.consumers.get(method);

        // Enable this for debugging. If enabled, it will reveal in the log the secret recovery phrase when revealing it through settings.
        // console.log('Forwarding data to consumers:', data);

        // Make sure we execute the listeners in Angular Zone.
        this.ngZone.run(() => {
            consumer?.forEach((c) => {
                c.listener(data);
            });
        });
    }

    send(method: string, data?: any) {
        console.log('UI:send:', method);
        this.port?.postMessage({ method, data });
    }

    /** Add a listener to specific messages that is received in the app. Returns an subscription object that must be used to unlisten. */
    listen(method: string, listener: any) {
        let key = uuidv4();

        if (!this.consumers.has(method)) {
            this.consumers.set(method, [{ key, listener }]);
        } else {
            const consumer = this.consumers.get(method);
            consumer?.push({ key, listener });
        }

        return { method, key };
    }

    /** Remove a listener to specific messages. */
    unlisten(subscription: { method: string, key: string }) {
        if (!this.consumers.has(subscription.method)) {
            console.log('There are no consumers to unlisten to:', subscription);
            return;
        }

        const consumer = this.consumers.get(subscription.method);

        console.log('REMOVING LISTENER KEY:', subscription.key);
        console.log(JSON.stringify(consumer));

        const subscriber = consumer?.findIndex(c => c.key == subscription.key) as number;

        console.log('Subscriber Index:', subscriber);

        if (subscriber !== -1) {
            consumer?.splice(subscriber, 1);
        }

        console.log(JSON.stringify(consumer));
    }
}
