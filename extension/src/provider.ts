import { ActionMessage, ActionRequest, EventEmitter, Listener, RequestArguments } from '../../angular/src/shared';

/*
Register global provider for Blockcore, only supports EIP1193Provider (request) function for interaction. 
This is to simplify this code and logic, and Web Providers can make developer-friendly wrappers.
*/
globalThis.blockcore = {
  _requests: {},
  _events: new EventEmitter(),

  _call(type, request: RequestArguments) {
    return new Promise((resolve, reject) => {
      const id = v4();
      this._requests[id] = { resolve, reject };

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
        request.params = [];
      } else if (!Array.isArray(request.params)) {
        // If the request has parameters and that parameter is not array, encapsulate the params into
        // an array so we'll always work with arrays.
        request.params = [request.params];
      }

      const msg: ActionMessage = { type, id, request: <ActionRequest>request, source: 'provider', target: 'tabs', ext: 'blockcore' };
      console.log('Provider:postMessage:', msg);

      globalThis.postMessage(msg, '*');
    });
  },

  async request(request: RequestArguments): Promise<unknown> {
    return this._call('request', request);
  },

  on(event: string, listener: Listener) {
    return this._events.on(event, listener);
  },

  removeListener(event: string, listener: Listener) {
    this._events.removeListener(event, listener);
  },
};

// This will receive various messages that are posted to the window. Make sure we filter out anything that
// is not related to the extension.
globalThis.addEventListener('message', (message) => {
  // Make sure there is response in the data, extension is setup and it belongs to the existing promises in this web app.
  if (!message.data || !message.data.response || message.data.ext !== 'blockcore' || !globalThis.blockcore._requests[message.data.id]) {
    return;
  }

  console.log('MESSAGE RECEIVED IN PROVIDER:', message);
  const data = message.data as ActionMessage;

  // It is possible that calls to the extension is returned without handled by an instance of the extension,
  // if that happens, then response will be undefined.

  if (data.response?.error) {
    let error = new Error(data.response.error.message);
    error.stack = data.response.error?.stack;
    globalThis.blockcore._requests[data.id].reject(error);
  } else {
    globalThis.blockcore._requests[data.id].resolve(data.response);
  }

  delete globalThis.blockcore._requests[data.id];
});

function v4() {
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
