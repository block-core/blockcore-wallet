// OrchestratorBackgroundService
// Responsible for orchestrating events and processing when running in extension mode.

import { Message } from '../../angular/src/shared/interfaces';
import { BackgroundManager, ProcessResult } from '../../angular/src/shared/background-manager';
import { SharedManager } from '../../angular/src/shared/shared-manager';
import { RunState } from '../../angular/src/shared/task-runner';

let watchManager: BackgroundManager = null;
let networkManager: BackgroundManager = null;
let indexing = false;
let shared = new SharedManager();

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

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    // console.debug('onInstalled', reason);

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
        // Open a new tab for initial setup.
        chrome.tabs.create({ url: "index.html" });
    } else if (reason === 'update') {
        // Run a full indexing when the extension has been updated/reloaded.
        await networkStatusWatcher();
        await executeIndexer();
    }
});

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
    // console.debug('onAlarm', alarm);

    if (alarm.name === 'periodic') {
        await shared.checkLockTimeout();
    } else if (alarm.name === 'index') {
        await executeIndexer();
    }
});

chrome.runtime.onMessage.addListener(async (message: Message, sender, sendResponse) => {
    // console.debug('MESSAGE RECEIVED!', message);

    if (message.type === 'keep-alive') {
        // console.debug('Received keep-alive message.');
    } else if (message.type === 'index') {
        await executeIndexer();
    } else if (message.type === 'watch') {
        await runWatcher();
    } else if (message.type === 'network') {
        await networkStatusWatcher();
    } else if (message.type === 'activated') {
        console.log('THE UI WAS ACTIVATED!!');
        // When UI is triggered, we'll also trigger network watcher.
        await networkStatusWatcher();
    }

    sendResponse('ok');
    return 'ok';
});

// let store = new NetworkStatusStore();
let networkWatcherRef = null;

const networkStatusWatcher = async () => {
    // const manifest = chrome.runtime.getManifest();

    if (networkWatcherRef) {
        globalThis.clearTimeout(networkWatcherRef);
        networkWatcherRef = null;
    }

    if (networkManager == null) {
        networkManager = new BackgroundManager();
    }

    var interval = async () => {
        // We don't have the Angular environment information available in the service worker,
        // so we'll default to the default blockcore accounts, which should include those that
        // are default on CoinVault.
        await networkManager.updateNetworkStatus('blockcore');

        chrome.runtime.sendMessage({
            type: 'network-updated',
            data: { source: 'network-status-watcher' },
            ext: 'blockcore',
            source: 'background',
            target: 'tabs',
            host: location.host
        }, function (response) {
            // console.log('Extension:sendMessage:response:indexed:', response);
        });

        // Continue running the watcher if it has not been cancelled.
        networkWatcherRef = globalThis.setTimeout(interval, 15000);
    }

    // First interval we'll wait for complete run.
    await interval();

    // networkWatcherRef = globalThis.setTimeout(async () => {
    //     await interval();
    // }, 0);
}

const executeIndexer = async () => {
    // If we are already indexing, simply ignore this request.
    if (indexing) {
        // console.log('Already indexing, skipping this indexing request.');
        return;
    }

    indexing = true;
    await runIndexer();
    indexing = false;

    // When the indexer has finished, run watcher automatically.
    await runWatcher();
}

const runIndexer = async () => {
    // Stop and ensure watcher doesn't start up while indexer is running.
    if (watchManager) {
        watchManager.onStopped = null;
        watchManager.stop();
        watchManager = null;
    }

    // Whenever indexer is executed, we'll create a new manager.
    let manager = new BackgroundManager();
    manager.onUpdates = (status: ProcessResult) => {
        if (status.changes) {
            console.log('Indexer found changes. Send message!');

            chrome.runtime.sendMessage({
                type: 'indexed',
                data: { source: 'indexer-on-schedule' },
                ext: 'blockcore',
                source: 'background',
                target: 'tabs',
                host: location.host
            }, function (response) {
                // console.log('Extension:sendMessage:response:indexed:', response);
            });

        } else {
            // console.log('Indexer found zero changes. We will still inform the UI to refresh wallet to get latest scan state.');

            chrome.runtime.sendMessage({
                type: 'updated',
                data: { source: 'indexer-on-schedule' },
                ext: 'blockcore',
                source: 'background',
                target: 'tabs',
                host: location.host
            }, function (response) {
                // console.log('Extension:sendMessage:response:updated:', response);
            });
        }
    }

    await manager.runIndexer();

    // Reset the manager after full indexer run.
    manager = null;
}

const runWatcher = async () => {
    // If we are indexing, simply ignore all calls to runWatcher.
    if (indexing) {
        return;
    }

    // If there are multiple requests incoming to stop the watcher at the same time
    // they will all simply mark the watch manager to stop processing, which will 
    // automatically start a new instance when finished.
    if (watchManager != null) {
        // First stop the existing watcher process.
        watchManager.stop();
        // console.log('Calling to stop watch manager...');
    } else {
        watchManager = new BackgroundManager();

        // Whenever the manager has successfully stopped, restart the watcher process.
        watchManager.onStopped = () => {
            // console.log('Watch Manager actually stopped, re-running!!');
            watchManager = null;
            runWatcher();
        };

        watchManager.onUpdates = (status: ProcessResult) => {
            if (status.changes) {
                console.log('Watcher found changes. Sending message to UI!');

                chrome.runtime.sendMessage({
                    type: 'indexed',
                    data: { source: 'watcher' },
                    ext: 'blockcore',
                    source: 'background',
                    target: 'tabs',
                    host: location.host
                }, function (response) {
                    // console.log('Extension:sendMessage:response:indexed:', response);
                });
            }
            else {
                // console.debug('Watcher found zero changes. We will still inform the UI to refresh wallet to get latest scan state.');

                chrome.runtime.sendMessage({
                    type: 'updated',
                    data: { source: 'watcher' },
                    ext: 'blockcore',
                    source: 'background',
                    target: 'tabs',
                    host: location.host
                }, function (response) {
                    // console.log('Extension:sendMessage:response:updated:', response);
                });
            }
        }

        let runState: RunState = {

        };

        await watchManager.runWatcher(runState);
    }
};

// // For future usage when Point-of-Sale window is added, opening the window should just focus that tab.
// await chrome.tabs.update(tabs[0].id, { active: true });

// // Setting the badge
// await chrome.action.setBadgeText({ text: '44' });
// await chrome.action.setBadgeBackgroundColor({ color: 'red' });
