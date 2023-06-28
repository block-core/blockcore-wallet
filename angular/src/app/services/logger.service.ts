import { INGXLoggerConfig, INGXLoggerMetadata, INGXLoggerMonitor, NGXLogger, NgxLoggerLevel } from 'ngx-logger';
import { Injectable } from '@angular/core';
import { Logger } from '../../shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class LoggerService implements Logger {
  constructor(private logger: NGXLogger) {
    logger.registerMonitor(new LocalMonitor())
  }

  /** Change the logging level to TRACE. This is not persisted and reset on app reloads. */
  enableDebug() {
    this.logger.updateConfig({ level: NgxLoggerLevel.TRACE });
  }

  disableDebug() {
    this.logger.updateConfig({ level: NgxLoggerLevel.INFO });
  }

  trace(message?: any | (() => any), ...additional: any[]): void {
    this.logger.trace(message, ...additional);
  }

  debug(message?: any | (() => any), ...additional: any[]): void {
    this.logger.debug(message, ...additional);
  }

  info(message?: any | (() => any), ...additional: any[]): void {
    this.logger.info(message, ...additional);
  }

  log(message?: any | (() => any), ...additional: any[]): void {
    this.logger.log(message, ...additional);
  }

  warn(message?: any | (() => any), ...additional: any[]): void {
    this.logger.warn(message, ...additional);
  }

  error(message?: any | (() => any), ...additional: any[]): void {
    this.logger.error(message, ...additional);
  }

  fatal(message?: any | (() => any), ...additional: any[]): void {
    this.logger.fatal(message, ...additional);
  }

  changeLogLevel(): void {
    const config = this.logger.getConfigSnapshot()
    config.level = config.level === NgxLoggerLevel.TRACE ? NgxLoggerLevel.ERROR : NgxLoggerLevel.TRACE;
    this.logger.updateConfig(config);
  }
}

export class LocalMonitor implements INGXLoggerMonitor {
  onLog(logObject: INGXLoggerMetadata, config: INGXLoggerConfig): void {
    console.error('Hi there from the local monitor');
  }
}
