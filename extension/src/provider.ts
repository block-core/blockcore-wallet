// Register global provider for Blockcore:
globalThis.blockcore = {
    _promises: {},

    _call(type, data) {
        return new Promise((resolve, reject) => {
            const id = v4();
            this._promises[id] = { resolve, reject };

            globalThis.postMessage({ type, id, data, source: 'provider', target: 'tabs', ext: 'blockcore' }, '*');
        });
    },

    connect: (callback) => {

    },
    open: () => {
        chrome.runtime.sendMessage({ greeting: "hello from provider" }, function (response) {
            // console.log(response.farewell);
        });

        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            console.log('onMessage (PROVIDER): ' + JSON.stringify(request));
            sendResponse({ fromcontent: "This message is from provider.js" });
        });

    },
    getAccounts: () => {
        console.log('Getting accounts!');
    },
    on: (event, callback) => {

    },
    async getPublicKey() {
        return this._call('getpublickey', null);
    },
    async login() {
        return this._call('login', { ok: false });
    },
    // loadScript: (url) => {
    //     var script = document.createElement("script");
    //     script.src = url;
    //     document.head.appendChild(script);
    // }
};

// This will receive various messages that are posted to the window. Make sure we filter out anything that
// is not related to the extension.
globalThis.addEventListener('message', message => {
    // Make sure there is data, extension is setup and it belongs to the existing promises in this web app.
    if (!message.data || !message.data.ext || !message.data.response || !globalThis.blockcore._promises[message.data.id]) {
        return;
    }

    // It is possible that calls to the extension is returned without handled by an instance of the extension,
    // if that happens, then response will be undefined.

    console.log('globalThis.addEventListener (PROVIDER), HANDLE THIS MESSAGE: ', message);

    if (message.data.response?.error) {
        let error = new Error('blockcore: ' + message.data.response.error.message);
        error.stack = message.data.response.error.stack;
        globalThis.blockcore._promises[message.data.id].reject(error);
    } else {
        globalThis.blockcore._promises[message.data.id].resolve(message.data.response);
    }
});

// TODO: Only override the nostr handler when user has decided that this should happen!
globalThis.nostr = {
    _requests: {},
    _pubkey: null,

    async getPublicKey() {
        if (this._pubkey) return this._pubkey
        this._pubkey = await this._call('getPublicKey', {})
        return this._pubkey
    },

    async signEvent(event) {
        return this._call('signEvent', { event })
    },

    async getRelays() {
        return this._call('getRelays', {})
    },

    nip04: {
        async encrypt(peer, plaintext) {
            return globalThis.nostr._call('nip04.encrypt', { peer, plaintext })
        },

        async decrypt(peer, ciphertext) {
            return globalThis.nostr._call('nip04.decrypt', { peer, ciphertext })
        }
    },

    _call(type, params) {
        return new Promise((resolve, reject) => {
            let id = Math.random().toString().slice(4)
            this._requests[id] = { resolve, reject }
            window.postMessage(
                {
                    id,
                    ext: 'nos2x',
                    type,
                    params
                },
                '*'
            )
        })
    }
}

/** Taken from here to avoid dependency on UUID package in the provider.ts: https://github.com/decentralized-identity/web-extension/blob/master/extension/js/modules/uuid.js */
function randomBytes(length = 16, format) {
    let bytes = crypto.getRandomValues(new Uint8Array(length));
    switch (format) {
        case 'raw': return bytes;
        case 'base64Url': return;
        default: return bytes.join('');
    }
};

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
};