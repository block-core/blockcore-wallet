console.log('Blockcore Extension: ServiceWorker script loaded');

// Run when the browser has been fully exited and opened again.
chrome.runtime.onStartup.addListener(async () => {
    console.log('BACKGROUND: onStartup');
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    console.log('onInstalled', reason);

    chrome.alarms.get('periodic', a => {
        if (!a) chrome.alarms.create('periodic', { periodInMinutes: 0.5 });
    });

    if (reason === 'install') {

        // Exception: chrome.extension.getViews is not a function
        // var popups = chrome.extension.getViews({ type: "popup" });
        // if (popups.length != 0) {
        //     console.log('FOUND A POPUP!!');
        //     var popup = popups[0];
        //     console.log(popup);
        //     // popup.doSomething();
        // }
        // else {
        //     console.log('No POPUP!?!!');
        // }

        // Open a new tab for initial setup.
        chrome.tabs.create({ url: "index.html" });
    } else if (reason === 'update') {
        // var popups = chrome.extension.getViews({ type: "popup" });
        // if (popups.length != 0) {
        //     console.log('FOUND A POPUP!!');
        //     var popup = popups[0];
        //     console.log(popup);
        //     // popup.doSomething();
        // }
        // else {
        //     console.log('No POPUP!?!!');
        // }

        // Open a new tab for initial setup.
        chrome.tabs.create({ url: "index.html" });
    }
});


chrome.alarms.onAlarm.addListener(async () => {
    console.log('on ALARM!!');

    const storage = globalThis.chrome.storage as any;

    // Get both "active" (Date) and timeout (number of minutes) from local settings.
    const { active, timeout } = await chrome.storage.local.get(['active', 'timeout']);

    console.log('active:', active);
    console.log('timeout:', timeout);

    // Reset storage if there is no 'active' state data.
    if (!active) {
        await storage.session.remove(['keys']);
        // await storage.session.clear(); // Might be dramatic to clear to whole session storage?
        console.log('There are no active value, session storage is cleared.');
    } else {
        // Parse the active date.
        const currentResetDate = new Date(active);

        // This value is read from user settings.
        const timeoutMs = (timeout * 60 * 1000);

        // The reset date is current date minus the timeout.
        var resetDate = new Date(new Date().valueOf() - timeoutMs);

        console.log('resetDate: ', resetDate.toJSON());
        console.log('currentResetDate: ', currentResetDate.toJSON());

        // Check of the timeout has been reached and clear if it has.
        if (resetDate > currentResetDate) {
            await storage.session.remove(['keys']);
            // await storage.session.clear(); // Might be dramatic to clear to whole session storage?
            console.log('Timeout has been researched, session storage is cleared.');
        } else {
            console.log('TIMEOUT NOT REACHED YET!!');
        }
    }
});
