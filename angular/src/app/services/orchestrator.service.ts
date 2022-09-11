import { Injectable } from '@angular/core';
import { SharedManager } from 'src/shared/shared-manager';
import { EventBus } from '../../shared/event-bus';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class OrchestratorService {
  private _initialized = false;

  constructor(private logger: LoggerService, private events: EventBus, private shared: SharedManager) {}

  /** Initializes the Orchestrator Service responsible for events and processing in browser/mobile mode. Should only be called when running outside of extension context. */
  initialize() {
    if (this._initialized) {
      return;
    }

    this._initialized = true;
    this.logger.debug('OrchestratorService wiring up listeners.');

    // This is the interval that checks lock timeout in the UI. There is additionally a similar call in background.ts.
    setInterval(async () => {
      this.logger.debug('periodic interval called.');
      await this.shared.checkLockTimeout();
    }, 60000); // 'periodic', 1 minute

    // setInterval(() => {
    //   this.logger.debug('index interval called.');
    // }, 60000 * 10); // 'index', 10 minute
  }
}
