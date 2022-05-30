import { Injectable } from "@angular/core";
import { LoggerService } from "./logger.service";
const { v4: uuidv4 } = require('uuid');

@Injectable({
    providedIn: 'root'
})
/** Service that handles channels between background and frontend, with subscriptions. */
export class CommunicationBackgroundService {
    private consumers = new Map<string, any[]>();
    private secureChannels: chrome.runtime.Port[] = [];
    private insecureChannels: chrome.runtime.Port[] = [];

    constructor(private logger: LoggerService) {

    }

    private trigger(port: any, method: string, data: any) {
        if (!this.consumers.has(method)) {
            this.logger.info('There are no listeners for: ', method);
            return;
        }

        var consumer = this.consumers.get(method);

        this.logger.info('Consumer to call:', consumer);

        consumer?.forEach((subscription) => {
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

        this.logger.info('Starting to listen to: ', method);

        let key = uuidv4();

        if (!this.consumers.has(method)) {
            this.consumers.set(method, [{ key, listener }]);
        } else {
            const consumer = this.consumers.get(method);
            consumer?.push({ key, listener });
        }

        this.logger.info(this);

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
