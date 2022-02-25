// console.log('BLOCKCORE PROVIDER!!!');

// class BlockcoreProvider {
//     initialize() {
//         return true;
//     };

//     open() {
//         console.log('OPEN UI!');
//     }
// }

// window.blockcore.provider = new BlockcoreProvider();

// chrome.runtime.onStartup.addListener(function () {
//     console.log('onStartup:provider');
//     // chrome.storage.local.set({ has_been_notified: false });
//   });

// Register global provider for Blockcore:
globalThis.blockcore = {
    connect: (callback) => {

    },
    open: () => {
        console.log('OPEN UI!');

        console.log(chrome.runtime);

        // var port = chrome.runtime.connect({ name: "knockknock" });

        // port.postMessage({ joke: "Knock knock" });
        // port.onMessage.addListener(function (msg) {
        //     if (msg.question == "Who's there?")
        //         port.postMessage({ answer: "Madame" });
        //     else if (msg.question == "Madame who?")
        //         port.postMessage({ answer: "Madame... Bovary" });
        // });

        // const extensionId = 'oebogngphcemipfobgcehenpohfhkhpc';

        // var views = chrome.extension.getViews({ type: "popup" }); //https://stackoverflow.com/questions/8920953/how-determine-if-the-popup-page-is-open-or-not
        // if (views.length > 0) {
        //     console.log("Popup is visible");
        //     return true;
        // }
        // return false;

        chrome.runtime.sendMessage({ greeting: "hello from provider" }, function (response) {
            // console.log(response.farewell);
        });

        // chrome.runtime.sendMessage(extensionId, { message: 'buttonClicked' },
        //     function () {
        //         console.log('callback!! in provider!');
        //     });

        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            console.log('onMessage (PROVIDER): ' + JSON.stringify(request));
            sendResponse({ fromcontent: "This message is from provider.js" });
        });

    },
    getAccounts: () => {
        console.log('Getting accounts!');

        // chrome.runtime.sendMessage({ greeting: "hello" }, function (response) {
        //     console.log(response.farewell);
        // });

    },
    on: (event, callback) => {

    },
    async getPublicKey() {
        return '12345';
    },
    async login() {
        // The provider script does not have access to chrome!
        globalThis.postMessage({ type: 'login', id: v4(), data: { ok: false }, source: 'provider', target: 'tabs', ext: 'blockcore' }, '*');

        return 'wait';

        // console.log(chrome.runtime);

        // chrome.runtime.sendMessage({ type: 'login', id: '123', data: { ok: false }, source: 'provider', target: 'tabs' }, function (response) {
        //     console.log('RESPONSE IN PROVIDER', response);
        // });
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
    if (!message.data || !message.data.ext) {
        return;
    }

    console.log('globalThis.addEventListener (PROVIDER), HANDLE THIS MESSAGE: ', message);
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