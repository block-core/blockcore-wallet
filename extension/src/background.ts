import { Message } from '../../angular/src/app/interfaces';
import { IndexerBackgroundService } from '../../angular/src/shared/indexer';

console.log('Extension: ServiceWorker script loaded');

// Run when the browser has been fully exited and opened again.
chrome.runtime.onStartup.addListener(async () => {
    console.log('Extension: onStartup');
});

chrome.runtime.onSuspend.addListener(() => {
    console.log("Extension: onSuspend.");
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    console.log('onInstalled', reason);

    // Periodic alarm that will check if wallet should be locked.
    chrome.alarms.get('periodic', a => {
        if (!a) chrome.alarms.create('periodic', { periodInMinutes: 1 });
    });

    // The index alarm is used to perform background scanning of the 
    // whole address space of all wallets. This will check used addresses
    // that might have received transactions after used the first time.
    // This will be called at a slow interval, time to be decided later.
    chrome.alarms.get('index', a => {
        if (!a) chrome.alarms.create('index', { periodInMinutes: 2 });
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

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
    if (alarm.name === 'periodic') {
        const storage = globalThis.chrome.storage as any;

        // Get both "active" (Date) and timeout (number of minutes) from local settings.
        const { active, timeout } = await chrome.storage.local.get(['active', 'timeout']);

        // Reset storage if there is no 'active' state data.
        if (!active) {
            await storage.session.remove(['keys']);
            // await storage.session.clear(); // Might be dramatic to clear to whole session storage?
            console.log('There are no active value, session storage is cleared.');
        } else {
            // Parse the active date.
            const timeoutDate = new Date(active);

            // The reset date is current date minus the timeout.
            var resetDate = new Date(new Date().valueOf() - timeout);

            // console.log('resetDate: ', resetDate.toJSON());
            // console.log('timeoutDate: ', timeoutDate.toJSON());

            // Check of the timeout has been reached and clear if it has.
            if (resetDate > timeoutDate) {
                await storage.session.remove(['keys']);
                // await storage.session.clear(); // Might be dramatic to clear to whole session storage?
                console.log('Timeout has been researched, session storage is cleared.');

                chrome.runtime.sendMessage({ event: 'timeout' }, function (response) {
                    console.log('Extension:sendMessage:response:', response);
                });
            }
        }
    } else if ('index') {
        // Process Wallets
        // Get what addresses to watch from local storage.
        // globalThis.chrome.storage.local.get('')
        const indexer = new IndexerBackgroundService();
        // indexer.process();


        





    }
});

// chrome.runtime.onMessage.addListener((message, callback) => {
//     const tabId = getForegroundTabId();
//     if (message.data === "setAlarm") {
//         chrome.alarms.create({ delayInMinutes: 5 })
//     } else if (message.data === "runLogic") {
//         chrome.scripting.executeScript({ file: 'logic.js', tabId });
//     } else if (message.data === "changeColor") {
//         chrome.scripting.executeScript(
//             { func: () => document.body.style.backgroundColor = "orange", tabId });
//     };
// });

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    if (message.target !== 'background') {
        console.log('This message is not handled by the background logic.');
        return;
    }

    console.log('Background:onMessage: ', message);
    console.log('Background:onMessage:callback: ', sender);

    let response;

    // Do we want to allow events to be triggered from the web app -> provider -> content and into background script?
    try {
        switch (message.type) {
            case 'index': {
                response = '545555';
            }
            default:
                console.log(`The message type ${message.type} is not known.`);
                response = null;
        }
    } catch (error: any) {
        return { error: { message: error.message, stack: error.stack } }
    }

    sendResponse(response);

    // if (message === 'hello') {
    //   sendResponse({greeting: 'welcome!'})
    // } else if (message === 'goodbye') {
    //   chrome.runtime.Port.disconnect();
    // }
});