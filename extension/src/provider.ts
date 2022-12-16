import { ActionMessage, ActionRequest, ActionResponse, EventEmitter, Listener } from '../../angular/src/shared';
import { Injector, RequestArguments, Web5RequestProvider } from '@blockcore/web5-injector';

export class BlockcoreRequestProvider implements Web5RequestProvider {
  name = 'Blockcore';
  #requests = {};
  #events = new EventEmitter();

  constructor() {
    // This will receive various messages that are posted to the window. Make sure we filter out anything that
    // is not related to the extension.
    globalThis.addEventListener('message', (message) => {
      // Make sure there is response in the data, extension is setup and it belongs to the existing promises in this web app.
      if (!message.data || !message.data.response || message.data.ext !== 'blockcore' || !this.#requests[message.data.id]) {
        return;
      }

      const data = message.data as ActionMessage;

      // It is possible that calls to the extension is returned without handled by an instance of the extension,
      // if that happens, then response will be undefined.

      if (data.response?.error) {
        let error = new Error(data.response.error.message);
        error.stack = data.response.error?.stack;

        this.#requests[data.id].reject(error);
      } else {
        this.#requests[data.id].resolve(data.response);
      }

      delete this.#requests[data.id];
    });
  }

  async request(request: RequestArguments): Promise<unknown> {
    return this.#call('request', request);
  }

  on(event: string, listener: Listener) {
    return this.#events.on(event, listener);
  }

  removeListener(event: string, listener: Listener) {
    this.#events.removeListener(event, listener);
  }

  #call(type, request: RequestArguments) {
    return new Promise((resolve, reject) => {
      const id = this.#v4();
      this.#requests[id] = { resolve, reject };

      if (!request.method) {
        throw TypeError('Method is missing.');
      }

      if (typeof request.method !== 'string') {
        throw TypeError('Method must be string.');
      }

      if (request.method.length > 30) {
        throw TypeError('Method cannot be longer than 30 characters.');
      }

      // If there are no params, construct an empty array to simplify null-checks in the extension.
      if (!request.params) {
        // request.params = [];
      } else if (!Array.isArray(request.params)) {
        // If the request has parameters and that parameter is not array, encapsulate the params into
        // an array so we'll always work with arrays.
        // request.params = [request.params];
      }

      const msg: ActionMessage = { type, id, request: <ActionRequest>request, source: 'provider', target: 'tabs', ext: 'blockcore' };
      console.log('Provider:postMessage:', msg);

      globalThis.postMessage(msg, '*');
    });
  }

  #v4() {
    function getRandomSymbol(symbol) {
      var array;
      if (symbol === 'y') {
        array = ['8', '9', 'a', 'b'];
        return array[Math.floor(Math.random() * array.length)];
      }
      array = new Uint8Array(1);
      crypto.getRandomValues(array);
      return (array[0] % 16).toString(16);
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, getRandomSymbol);
  }
}

class NostrProvider {
  constructor(private provider: BlockcoreRequestProvider) {}

  /** Nostr NIP-07 function: https://github.com/nostr-protocol/nips/blob/master/07.md */
  async getPublicKey(): Promise<string | unknown> {
    const result = (await this.provider.request({
      method: 'nostr.publickey',
      params: [{}],
    })) as any;

    // Parse the response and only return event.
    return result.response;
  }

  /** Nostr NIP-07 function: https://github.com/nostr-protocol/nips/blob/master/07.md */
  async signEvent(event: Event): Promise<Event> {
    const result = (await this.provider.request({
      method: 'nostr.signevent',
      params: [event],
    })) as any;

    // Parse the response and only return event.
    return result.response;
  }

  async getRelays(): Promise<string[]> {
    const result = (await this.provider.request({
      method: 'nostr.getrelays',
      params: [{}],
    })) as any;

    return result.response || {};
  }

  nip04 = new NostrNip04(this.provider);
}

export class NostrNip04 {
  constructor(private provider: BlockcoreRequestProvider) {}

  async encrypt(plaintext: string): Promise<string> {
    const result = (await this.provider.request({
      method: 'nostr.encrypt',
      params: [plaintext],
    })) as any;

    return result.response || {};
  }

  async decrypt(ciphertext: string): Promise<string> {
    const result = (await this.provider.request({
      method: 'nostr.decrypt',
      params: [ciphertext],
    })) as any;

    return result.response || {};
  }
}

const provider = new BlockcoreRequestProvider();
Injector.register(provider);

// Also make our provider available on "blockcore".
globalThis.blockcore = provider;

// TODO: Consider playing nice with other extensions that implement the same global objects,
// perhaps something similar like the suggest Web5Provider. Also we should consider not injection if
// user have zero Nostr accounts in their wallets.
globalThis.nostr = new NostrProvider(provider);
