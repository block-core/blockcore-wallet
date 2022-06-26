// OrchestratorBackgroundService
// Responsible for orchestrating events and processing when running in extension mode.

import { HDKey } from '@scure/bip32';

import { Message } from '../../angular/src/shared/interfaces';
import { BackgroundManager, ProcessResult } from '../../angular/src/shared/background-manager';
import { SharedManager } from '../../angular/src/shared/shared-manager';
import { RunState } from '../../angular/src/shared/task-runner';

import { WalletStore } from '../../angular/src/shared/store/wallet-store';

let watchManager: BackgroundManager = null;
let networkManager: BackgroundManager = null;
let indexing = false;
let shared = new SharedManager();
const networkUpdateInterval = 45000;

let walletStore: WalletStore = null;

// Run when the browser has been fully exited and opened again.
chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension: onStartup');
});

chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension: onSuspend.');
});

async function getTabId() {
  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0].id;
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  console.debug('onInstalled', reason);

  // Periodic alarm that will check if wallet should be locked.
  chrome.alarms.get('periodic', (a) => {
    if (!a) chrome.alarms.create('periodic', { periodInMinutes: 1 });
  });

  // The index alarm is used to perform background scanning of the
  // whole address space of all wallets. This will check used addresses
  // that might have received transactions after used the first time.
  // TODO: Log the last UI activation date and increase the period by the time since
  // UI was last activated. If it's 1 hour since last time, set the periodInMinutes to 60.
  // And if user has not used the extension UI in 24 hours, then set interval to 24 hours.
  chrome.alarms.get('index', (a) => {
    if (!a) chrome.alarms.create('index', { periodInMinutes: 10 });
  });

  if (reason === 'install') {
    // Open a new tab for initial setup.
    chrome.tabs.create({ url: 'index.html' });
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

async function handleContentScriptMessage({ type, params, host }) {
  //   let level = await readPermissionLevel(host);

  //   if (level >= PERMISSIONS_REQUIRED[type]) {
  //     // authorized, proceed
  //   } else {
  //     // ask for authorization
  //     try {
  //       await promptPermission(host, PERMISSIONS_REQUIRED[type], params);
  //       // authorized, proceed
  //     } catch (_) {
  //       // not authorized, stop here
  //       return {
  //         error: `insufficient permissions, required ${PERMISSIONS_REQUIRED[type]}`,
  //       };
  //     }
  //   }

  return { error: 'no private key found' };

  //   let results = await chrome.storage.local.get('private_key');
  //   if (!results || !results.private_key) {
  //     return { error: 'no private key found' };
  //   }

  //   let sk = results.private_key;

  //   try {
  //     switch (type) {
  //       case 'getPublicKey': {
  //         return getPublicKey(sk);
  //       }
  //       case 'getRelays': {
  //         let results = await browser.storage.local.get('relays');
  //         return results.relays || {};
  //       }
  //       case 'signEvent': {
  //         let { event } = params;

  //         if (!event.pubkey) event.pubkey = getPublicKey(sk);
  //         if (!event.id) event.id = getEventHash(event);
  //         if (!validateEvent(event)) return { error: 'invalid event' };

  //         event.sig = await signEvent(event, sk);
  //         return event;
  //       }
  //       case 'nip04.encrypt': {
  //         let { peer, plaintext } = params;
  //         return encrypt(sk, peer, plaintext);
  //       }
  //       case 'nip04.decrypt': {
  //         let { peer, ciphertext } = params;
  //         return decrypt(sk, peer, ciphertext);
  //       }
  //     }
  //   } catch (error) {
  //     return { error: { message: error.message, stack: error.stack } };
  //   }
}

chrome.runtime.onMessageExternal.addListener(async ({ type, params }, sender) => {
  console.log('onMessageExternal!!!!!!!!');
  return 'ok';
  //   let extensionId = new URL(sender.url).host;
  //   return handleContentScriptMessage({ type, params, host: extensionId });
});

// chrome.runtime.onMessage.addListener(async (req, sender) => {
//   let { prompt } = req;

//   if (prompt) {
//     console.log('handlePromptMessage');
//     // return handlePromptMessage(req, sender);
//   } else {
//     console.log('handleContentScriptMessage');
//     // return handleContentScriptMessage(req);
//   }
// });

chrome.runtime.onMessage.addListener(async (message: Message, sender, sendResponse) => {
  console.debug('MESSAGE RECEIVED IN BACKGROUND!!', message);
  sendResponse(res);
  return 'ok';

  if (message.type === 'keep-alive') {
    // console.debug('Received keep-alive message.');
  } else if (message.type === 'index') {
    await executeIndexer();
  } else if (message.type === 'watch') {
    await runWatcher();
  } else if (message.type === 'network') {
    await networkStatusWatcher();
  } else if (message.type === 'activated') {
    // console.log('THE UI WAS ACTIVATED!!');
    // When UI is triggered, we'll also trigger network watcher.
    await networkStatusWatcher();
  } else if (message.type === 'getpublickey') {
    if (walletStore == null) {
      walletStore = new WalletStore();
      await walletStore.load();
    }

    var wallets = walletStore.getWallets();

    var res: any;
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      for (let j = 0; j < wallet.accounts.length; j++) {
        const account = wallet.accounts[j];
        res = account.xpub;
      }
    }

    ////const accountNode = HDKey.fromExtendedKey(account.xpub, network.bip32);

    sendResponse(res);
    return 'ok';
  } else if (message.type === 'login') {
    sendResponse('login');
    return 'ok';
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

    // chrome.runtime.sendMessage(
    //   {
    //     type: 'network-updated',
    //     data: { source: 'network-status-watcher' },
    //     ext: 'blockcore',
    //     source: 'background',
    //     target: 'tabs',
    //     host: location.host,
    //   },
    //   function (response) {
    //     // console.log('Extension:sendMessage:response:indexed:', response);
    //   }
    // );

    // Continue running the watcher if it has not been cancelled.
    networkWatcherRef = globalThis.setTimeout(interval, networkUpdateInterval);
  };

  // First interval we'll wait for complete run.
  await interval();

  // networkWatcherRef = globalThis.setTimeout(async () => {
  //     await interval();
  // }, 0);
};

const executeIndexer = async () => {
  // If we are already indexing, simply ignore this request.
  if (indexing) {
    console.log('Already indexing, skipping this indexing request.');
    return;
  }

  indexing = true;
  await runIndexer();
  indexing = false;

  // When the indexer has finished, run watcher automatically.
  await runWatcher();
};

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

    //   chrome.runtime.sendMessage(
    //     {
    //       type: 'indexed',
    //       data: { source: 'indexer-on-schedule' },
    //       ext: 'blockcore',
    //       source: 'background',
    //       target: 'tabs',
    //       host: location.host,
    //     },
    //     function (response) {
    //       // console.log('Extension:sendMessage:response:indexed:', response);
    //     }
    //   );
    } else {
      console.log('Indexer found zero changes. We will still inform the UI to refresh wallet to get latest scan state.');

    //   chrome.runtime.sendMessage(
    //     {
    //       type: 'updated',
    //       data: { source: 'indexer-on-schedule' },
    //       ext: 'blockcore',
    //       source: 'background',
    //       target: 'tabs',
    //       host: location.host,
    //     },
    //     function (response) {
    //       // console.log('Extension:sendMessage:response:updated:', response);
    //     }
    //   );
    }
  };

  await manager.runIndexer();

  // Reset the manager after full indexer run.
  manager = null;
};

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

        // chrome.runtime.sendMessage(
        //   {
        //     type: 'indexed',
        //     data: { source: 'watcher' },
        //     ext: 'blockcore',
        //     source: 'background',
        //     target: 'tabs',
        //     host: location.host,
        //   },
        //   function (response) {
        //     // console.log('Extension:sendMessage:response:indexed:', response);
        //   }
        // );
      } else {
        console.debug('Watcher found zero changes. We will still inform the UI to refresh wallet to get latest scan state.');

        // chrome.runtime.sendMessage(
        //   {
        //     type: 'updated',
        //     data: { source: 'watcher' },
        //     ext: 'blockcore',
        //     source: 'background',
        //     target: 'tabs',
        //     host: location.host,
        //   },
        //   function (response) {
        //     // console.log('Extension:sendMessage:response:updated:', response);
        //   }
        // );
      }
    };

    let runState: RunState = {};

    await watchManager.runWatcher(runState);
  }
};

// // For future usage when Point-of-Sale window is added, opening the window should just focus that tab.
// await chrome.tabs.update(tabs[0].id, { active: true });

// // Setting the badge
// await chrome.action.setBadgeText({ text: '44' });
// await chrome.action.setBadgeBackgroundColor({ color: 'red' });
