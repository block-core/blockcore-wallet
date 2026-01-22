/**
 * Types used by provider.ts that runs in the MAIN world (page context).
 * This file must NOT import webextension-polyfill or any module that does.
 */

export type Listener = (...args: any[]) => void;

export interface IEvents {
  [key: string]: Listener[];
}

export interface ActionRequest {
  method: string;
  params?: object[] | object;
}

export interface ActionResponse {
  error?: { message: string; stack?: string };
  notification?: string;
  [key: string]: any;
}

export interface ActionMessage {
  /** The type of action, this is currently limited to `request` */
  type: string;

  /** Data sent from web app. */
  request: ActionRequest;

  /** The response returned from action handler. */
  response?: ActionResponse;

  /** Additional data from the prompt. */
  promptResponse?: any;

  target: string;
  source: string;
  ext: string;
  id: string;
  permission?: string;
  app?: string;
  walletId?: string;
  accountId?: string;
  prompt?: boolean;

  /** The internal key ID used to persist permission. */
  keyId?: string;

  /** The public key used to identity the signature returned. */
  key?: string;

  /** Indicates if the current dapp domain is allowed or not. */
  verify?: boolean | undefined;
}

export class EventEmitter {
  private readonly events: IEvents = {};

  public on(event: string, listener: Listener): () => void {
    if (typeof this.events[event] !== 'object') {
      this.events[event] = [];
    }

    if (typeof listener !== 'function') {
      throw new TypeError('The listener must be a function');
    }

    if (!event) {
      throw TypeError('Event has to be specified');
    }

    this.events[event].push(listener);

    return () => this.removeListener(event, listener);
  }

  public removeListener(event: string, listener: Listener): void {
    if (typeof this.events[event] !== 'object') {
      return;
    }

    const idx: number = this.events[event].indexOf(listener);

    if (idx > -1) {
      this.events[event].splice(idx, 1);
    }
  }

  public removeAllListeners(): void {
    Object.keys(this.events).forEach((event: string) => this.events[event].splice(0, this.events[event].length));
  }

  public emit(event: string, ...args: any[]): void {
    if (typeof this.events[event] === 'object') {
      [...this.events[event]].forEach((listener) => listener.apply(this, args));
    }
  }

  public once(event: string, listener: Listener): () => void {
    const remove: () => void = this.on(event, (...args: any[]) => {
      remove();
      listener.apply(this, args);
    });

    return remove;
  }
}
