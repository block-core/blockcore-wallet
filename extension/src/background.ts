console.log('Blockcore Extension: ServiceWorker script loaded');

// Run when the browser has been fully exited and opened again.
chrome.runtime.onStartup.addListener(async () => {
    console.log('BACKGROUND: onStartup');
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    console.log('onInstalled', reason);

    if (reason === 'install') {
        var popups = chrome.extension.getViews({ type: "popup" });
        if (popups.length != 0) {
            console.log('FOUND A POPUP!!');
            var popup = popups[0];
            console.log(popup);
            // popup.doSomething();
        }
        else {
            console.log('No POPUP!?!!');
        }

        // Open a new tab for initial setup.
        chrome.tabs.create({ url: "index.html" });
    } else if (reason === 'update') {
        var popups = chrome.extension.getViews({ type: "popup" });
        if (popups.length != 0) {
            console.log('FOUND A POPUP!!');
            var popup = popups[0];
            console.log(popup);
            // popup.doSomething();
        }
        else {
            console.log('No POPUP!?!!');
        }

        // Open a new tab for initial setup.
        chrome.tabs.create({ url: "index.html" });
    }
});
