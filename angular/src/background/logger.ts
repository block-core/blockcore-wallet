import { Injectable } from '@angular/core';
import { Logger } from '../app/interfaces';

@Injectable({
    providedIn: 'root'
})
/** Logger used in the background service. Currently only performs console logging. */
export class BackgroundLoggerService implements Logger {
    // TODO: Implement similar functionality to the logger in Angular:
    trace(message?: any | (() => any), ...additional: any[]): void {
        console.trace(message, ...additional);
    };

    debug(message?: any | (() => any), ...additional: any[]): void {
        console.debug(message, ...additional);
    };

    info(message?: any | (() => any), ...additional: any[]): void {
        console.info(message, ...additional);
    };

    log(message?: any | (() => any), ...additional: any[]): void {
        console.log(message, ...additional);
    };

    warn(message?: any | (() => any), ...additional: any[]): void {
        console.warn(message, ...additional);
    };

    error(message?: any | (() => any), ...additional: any[]): void {
        console.error(message, ...additional);
    };

    fatal(message?: any | (() => any), ...additional: any[]): void {
        console.error(message, ...additional);
    };
}