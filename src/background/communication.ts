const { v4: uuidv4 } = require('uuid');

export class CommunicationBackgroundService {
    private port!: chrome.runtime.Port | null;
    // consumers: { [name: string]: any } = {};
    // consumers: Record<string, any> = {};
    private consumers = new Map<string, any[]>();
    private secureChannels: chrome.runtime.Port[] = [];
    private insecureChannels: chrome.runtime.Port[] = [];

    constructor() {

        chrome.runtime.onConnect.addListener((port) => {
            console.log('onConnect:', port);
            console.log('port.name:', port.name);

            // This is the main channel from extension UI to background.
            if (port.name === 'extension-channel') {

            }

            // Add the new Port to list of secure channels.
            this.secureChannels.push(port);

            // Remove from list when disconnected.
            port.onDisconnect.addListener(d => {
                console.log('Disconnected:', d);
                const index = this.secureChannels.indexOf(d);
                if (index !== -1) {
                    this.secureChannels.splice(index, 1);
                }
            });

            port.onMessage.addListener((message) => {

                console.log('onMessage listener:', message);

                if (!message.method) {
                    return;
                }

                // TODO: Do we want to and need to protect ourself by verifying method and data structures?
                // As a minimum, we'll serialize to JSON and back to Object.
                // UPDATE: JSON serialization was removed since it destroyed the "Map" object instances.
                const data = message.data // message.data ? JSON.parse(JSON.stringify(message.data)) : undefined;
                const method = message.method; // JSON.parse(JSON.stringify(message.method));

                // console.log('Trigger:', method);
                // console.log('Trigger:', data);

                this.trigger(port, method, data);

                // console.log('UI sent us: ', msg);

                // if (msg.method === 'unlock') {
                //     utility.password = msg.data;
                //     port.postMessage({ method: 'unlocked', data: true });
                // } else if (msg.method == 'unlocked') {
                //     if (utility.password) {
                //         port.postMessage({ method: 'unlocked', data: true });
                //     }
                //     else {
                //         port.postMessage({ method: 'unlocked', data: false });
                //     }
                // } else if (msg.method == 'getlock') {
                //     port.postMessage({ method: 'getlock', data: utility.password });
                // } else if (msg.method == 'lock') {
                //     utility.password = null;
                //     port.postMessage({ method: 'locked' });
                // }

                // port.postMessage({ answer: 'Yes I will!' });
            });

            if (port.sender && port.sender.tab && port.sender.url) {
                const tabId = port.sender.tab.id;
                const url = new URL(port.sender.url);
                const { origin } = url;
            }

            // console.log('onConnect!!', port);
            // // TODO: Calculate if we are communicating with the extension or untrusted web pages.
            // const trustedConnection = true;

            // if (trustedConnection) {

            //   if (port.name === "app-state") {

            //   }
            // }
            // else {
            //   console.log('UNTRUSTED CONNECTION!!');

            // }

        });

        chrome.runtime.onConnectExternal.addListener((port) => {
            console.log('onConnectExternal:', port);

            // Add the new Port to list of insecure channels (external connections from web pages or other extensions).
            this.insecureChannels.push(port);

            // Remove from list when disconnected.
            port.onDisconnect.addListener(d => {
                const index = this.insecureChannels.indexOf(d);
                if (index !== -1) {
                    this.insecureChannels.splice(index, 1);
                }
            });

            port.onMessage.addListener((msg) => {
                console.log('You sent us: ', msg);

                // We will only allow certain messages to be forwarded.
                if (msg.method == 'requestAccounts') {

                    // TODO: Add validation (stripping) of input, perhaps some third party library that exists for it?
                    const data = JSON.stringify(msg.data);
                    const validData = JSON.parse(data);

                    for (const p of this.secureChannels) {
                        console.log(p.postMessage({ method: 'requestAccounts', data: validData }));
                    }
                }

                port.postMessage({ response: 'You have connected and we will forward your messages to the app.' });
            });

        });

        // this.port = chrome.runtime.connect({ name: 'extension-channel' });

        // this.port.onDisconnect.addListener(d => {
        //     console.warn('We have disconnected the Port with background process.');
        //     this.port = null;
        // });

        // this.port.onMessage.addListener(message => {
        //     if (!message.method) {
        //         return;
        //     }

        //     // TODO: Do we want to and need to protect ourself by verifying method and data structures?
        //     // As a minimum, we'll serialize to JSON and back to Object.
        //     const data = message.data ? JSON.parse(JSON.stringify(message.data)) : undefined;
        //     const method = JSON.parse(JSON.stringify(message.method));

        //     this.trigger(method, data);
        // });
    }

    private trigger(port: any, method: string, data: any) {
        if (!this.consumers.has(method)) {
            console.log('There are no listeners for: ', method);
            return;
        }

        var consumer = this.consumers.get(method);

        console.log('Consumer to call:', consumer);

        consumer?.forEach((subscription) => {
            // console.log(subscription);
            // console.log(data);
            subscription.listener(port, data);
        });
    }

    send(port: any, method: string, data?: any) {
        port.postMessage({ method, data });
    }

    sendToAll(method: string, data?: any) {
        this.secureChannels.forEach((channel) => {
            channel.postMessage({ method, data });
        });
    }

    /** Add a listener to specific messages that is received in the app. Returns an subscription object that must be used to unlisten. */
    listen(method: string, listener: any) {

        console.log('Starting to listen to: ', method);

        let key = uuidv4();

        if (!this.consumers.has(method)) {
            this.consumers.set(method, [{ key, listener }]);
        } else {
            const consumer = this.consumers.get(method);
            consumer?.push({ key, listener });
        }

        console.log(this);

        return { method, key };
    }

    /** Remove a listener to specific messages. */
    unlisten(subscription: { method: string, key: string }) {
        if (!this.consumers.has(subscription.method)) {
            return;
        }

        const consumer = this.consumers.get(subscription.method);
        const subscriber = consumer?.findIndex(c => c.key) as number;

        if (subscriber !== -1) {
            consumer?.splice(subscriber, 1);
        }
    }
}
