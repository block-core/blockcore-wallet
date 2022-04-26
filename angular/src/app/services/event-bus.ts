import { Injectable } from "@angular/core";
import { filter, Observable, Subject, map } from "rxjs";
import { Message } from "src/shared";
const { v4: uuidv4 } = require('uuid');

/** This code is largely based upon the ng-event-bus repository by Cristiam Mercado
 * Source: https://github.com/cristiammercado/ng-event-bus
 * MIT Licensed
 */

export class EventBusMetaData {
    private readonly _id: string;
    private readonly _key: string;
    private readonly _data: any;
    private readonly _timestamp: number;

    constructor(key: string, data?: any) {
        this._id = uuidv4();
        this._key = key;
        this._data = data;
        this._timestamp = new Date().getTime();
    }

    public get id(): string {
        return this._id;
    }

    public get key(): string {
        return this._key;
    }

    public get data(): any {
        return this._data;
    }

    public get timestamp(): number {
        return this._timestamp;
    }
}

export interface IEventBusMessage {
    key: string;
    data?: any;
    metadata: EventBusMetaData;
}

@Injectable({
    providedIn: 'root'
})
export class EventBus {
    private eventBus: Subject<IEventBusMessage>;

    constructor() {
        this.eventBus = new Subject<IEventBusMessage>();
    }

    createMessage(type: string, data?: any, target: string = 'tabs'): Message {
        let key = uuidv4();

        return {
            id: key,
            type: type,
            data: data,
            source: 'browser',
            target: target
        }
    }

    public publish(key: string, data?: any): void {
        if (!key.trim().length) {
            throw new Error('key must be defined.');
        }

        const metadata: EventBusMetaData = new EventBusMetaData(key, data);
        this.eventBus.next({ key, data, metadata });
    }

    public subscribe<T>(key: string): Observable<EventBusMetaData> {
        return this.eventBus.asObservable().pipe(
            filter((event: IEventBusMessage) => this.keyMatch(event.key, key)),
            map((event: IEventBusMessage) => event.metadata)
        );
    }

    public subscribeAll<T>(): Observable<EventBusMetaData> {
        return this.eventBus.asObservable().pipe(
            map((event: IEventBusMessage) => event.metadata)
        );
    }

    private keyMatch(key: string, wildcard: string): boolean {
        const w = '*';
        const ww = '**';
        const sep = ':';

        const partMatch = (wl: string, k: string): boolean => {
            return wl === w || wl === k;
        };

        const kArr = key.split(sep);
        const wArr = wildcard.split(sep);

        const kLen = kArr.length;
        const wLen = wArr.length;
        const max = Math.max(kLen, wLen);

        for (let i = 0; i < max; i++) {
            const cK = kArr[i];
            const cW = wArr[i];

            if (cW === ww && typeof cK !== 'undefined') {
                return true;
            }

            if (!partMatch(cW, cK)) {
                return false;
            }
        }

        return true;
    }
}
