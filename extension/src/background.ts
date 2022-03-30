import { Message } from '../../angular/src/shared/interfaces';
import { BackgroundManager } from '../../angular/src/shared/background-manager';

let indexing = false;
let watching = false;

// Run when the browser has been fully exited and opened again.
chrome.runtime.onStartup.addListener(async () => {
    console.log('Extension: onStartup');
});

chrome.runtime.onSuspend.addListener(() => {
    console.log("Extension: onSuspend.");
});

async function getTabId() {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0].id;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('tabs.onUpdated!');
    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
    }
});

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
//         chrome.scripting.executeScript({
//             target: { tabId: tabId },
//             files: ["./foreground.js"]
//         })
//             .then(() => {
//                 console.log("INJECTED THE FOREGROUND SCRIPT.");
//             })
//             .catch(err => console.log(err));
//     }
// });

chrome.action.onClicked.addListener((tab) => {
    console.log('ACTION!!', tab);

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

    // const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    // const results = await chrome.scripting.executeScript({
    //   target: {tabId: tab.id},


});

chrome.action.onClicked.addListener((tab) => {
    console.log('The tab: ', tab);
    console.log('YES!!!');
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
    // TODO: Log the last UI activation date and increase the period by the time since
    // UI was last activated. If it's 1 hour since last time, set the periodInMinutes to 60.
    // And if user has not used the extension UI in 24 hours, then set interval to 24 hours.
    chrome.alarms.get('index', a => {
        if (!a) chrome.alarms.create('index', { periodInMinutes: 10 });
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
        // chrome.tabs.create({ url: "index.html" });
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
        // chrome.tabs.create({ url: "index.html" });
    }
});

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
    console.log('onAlarm', alarm);

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
    } else if (alarm.name === 'index') {
        if (!indexing) {
            indexing = true;

            const manager = new BackgroundManager();
            const changes = await manager.runIndexer();

            indexing = false;

            if (changes) {
                chrome.runtime.sendMessage({
                    type: 'indexed',
                    ext: 'blockcore',
                    source: 'background',
                    target: 'tabs',
                    host: location.host
                }, function (response) {
                    console.log('Extension:sendMessage:response:indexed:', response);
                });
            } else {
                console.log('Indexer found zero changes. We will still inform the UI to refresh wallet to get latest scan state.');

                chrome.runtime.sendMessage({
                    type: 'updated',
                    ext: 'blockcore',
                    source: 'background',
                    target: 'tabs',
                    host: location.host
                }, function (response) {
                    console.log('Extension:sendMessage:response:updated:', response);
                });

            }
        } else {
            console.log('Indexing is already running. Skipping for now.');
        }
    }
});

chrome.runtime.onMessage.addListener(async (message: Message, sender, sendResponse) => {
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
            case 'watch': {
                if (message.data.force) {
                    console.log('Force Watch was called!');
                    watch();
                    response = 'ok';
                }
                else if (!watching) {
                    watching = true;
                    // Run watch every 15 second until the service worker is killed.
                    watch();
                    setInterval(watch, 15000);
                    response = 'ok';
                } else {
                    console.log('Watcher is already running.');
                    response = 'busy';
                }

                break;
            }
            case 'index': {
                console.log('received index message....', indexing);
                if (!indexing) {
                    indexing = true;
                    response = 'ok';

                    const manager = new BackgroundManager();
                    const changes = await manager.runIndexer();

                    indexing = false;

                    if (changes) {
                        chrome.runtime.sendMessage({
                            type: 'indexed',
                            ext: 'blockcore',
                            source: 'background',
                            target: 'tabs',
                            host: location.host
                        }, function (response) {
                            console.log('Extension:sendMessage:response:indexed:', response);
                        });
                    } else {
                        console.log('Indexer found zero changes. We will still inform the UI to refresh wallet to get latest scan state.');

                        chrome.runtime.sendMessage({
                            type: 'updated',
                            ext: 'blockcore',
                            source: 'background',
                            target: 'tabs',
                            host: location.host
                        }, function (response) {
                            console.log('Extension:sendMessage:response:updated:', response);
                        });
                    }
                } else {
                    console.log('Indexing is already running. Skipping for now.');
                    response = 'busy';
                }

                break;
            }
            default:
                console.log(`The message type ${message.type} is not known.`);
                response = null;
                break;
        }
    } catch (error: any) {
        return { error: { message: error.message, stack: error.stack } }
    }

    sendResponse(response);
});

function watch() {
    // Do not run the watcher when the indexer is running.
    if (!indexing) {
        const manager = new BackgroundManager();
        manager.runWatcher().then(changes => {
            console.log('Watcher finished...', changes);

            if (changes) {
                chrome.runtime.sendMessage({
                    type: 'indexed',
                    ext: 'blockcore',
                    source: 'background',
                    target: 'tabs',
                    host: location.host
                }, function (response) {
                    console.log('Extension:sendMessage:response:indexed:', response);
                });
            }
            else {
                console.log('Watcher found zero changes. We will still inform the UI to refresh wallet to get latest scan state.');

                chrome.runtime.sendMessage({
                    type: 'updated',
                    ext: 'blockcore',
                    source: 'background',
                    target: 'tabs',
                    host: location.host
                }, function (response) {
                    console.log('Extension:sendMessage:response:updated:', response);
                });
            }
        });
    } else {
        console.log('Is already indexing, skipping watch processing.');
    }
}

// // For future usage when Point-of-Sale window is added, opening the window should just focus that tab.
// await chrome.tabs.update(tabs[0].id, { active: true });

// // Setting the badge
// await chrome.action.setBadgeText({ text: '44' });
// await chrome.action.setBadgeBackgroundColor({ color: 'red' });