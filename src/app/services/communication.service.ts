import { Injectable, NgZone } from '@angular/core';
const { v4: uuidv4 } = require('uuid');

@Injectable({
    providedIn: 'root'
})
export class CommunicationService {
    private port!: chrome.runtime.Port | null;
    // consumers: { [name: string]: any } = {};
    // consumers: Record<string, any> = {};
    private consumers = new Map<string, any[]>();

    constructor(private ngZone: NgZone) {
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

    private trigger(method: string, data: any) {
        console.log('UI:trigger:', method);

        if (!this.consumers.has(method)) {
            console.log('There are zero consumers of:', method);
            return;
        }

        var consumer = this.consumers.get(method);

        console.log('Forwarding data to consumers:', data);

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
