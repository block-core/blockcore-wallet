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
window.blockcore = {
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

    }
    // loadScript: (url) => {
    //     var script = document.createElement("script");
    //     script.src = url;
    //     document.head.appendChild(script);
    // }
};


