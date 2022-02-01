import { NGXLogger } from "ngx-logger";
import { Injectable } from '@angular/core';
import { Logger } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class LoggerService implements Logger {
    constructor(private logger: NGXLogger) {

    }

    trace(message?: any | (() => any), ...additional: any[]): void {
        this.logger.trace(message, ...additional);
    };

    debug(message?: any | (() => any), ...additional: any[]): void {
        this.logger.debug(message, ...additional);
    };

    info(message?: any | (() => any), ...additional: any[]): void {
        this.logger.info(message, ...additional);
    };

    log(message?: any | (() => any), ...additional: any[]): void {
        this.logger.log(message, ...additional);
    };

    warn(message?: any | (() => any), ...additional: any[]): void {
        this.logger.warn(message, ...additional);
    };

    error(message?: any | (() => any), ...additional: any[]): void {
        this.logger.error(message, ...additional);
    };

    fatal(message?: any | (() => any), ...additional: any[]): void {
        this.logger.fatal(message, ...additional);
    };
}