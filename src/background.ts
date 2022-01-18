import './global-shim';

import { AppState } from './background/application-state';
import { CommunicationBackgroundService } from './background/communication';
import { CryptoUtility } from './background/crypto-utility';
import { Persisted, State, Wallet } from './app/interfaces';
import { OrchestratorBackgroundService } from './background/orchestrator';
import { DataSyncService } from './background/data-sync';
import { AppManager } from './background/application-manager';

const manager = new AppManager();
manager.configure();

//const utility = new CryptoUtility();
//const state = new AppState();
// const communication = new CommunicationBackgroundService();
// const orchestrator = new OrchestratorBackgroundService();
// const sync = new DataSyncService();

const initialize = async () => {
  // CLEAR DATA FOR DEBUG PURPOSES:
  // chrome.storage.local.set({ 'data': null }, () => {
  // });

  debugger;

  // VERIFY:
  return manager.initialize();

  console.log('initialize is done in the background...');
  // VERIFY:
  //return await manager.loadState();
  // VERIFY:
  //await manager.loadState();

  //let { data, ui, action, store } = await manager.loadState();

  // console.log('STORE', store);

  // // Only set if data is available, will use default if not.
  // if (data) {
  //   state.persisted = data;
  // }

  // if (store) {
  //   state.store = store;
  // }

  // state.initialized = true;

  // state.ui = ui ?? {};

  // if (action) {
  //   state.action = action;
  // }

  // // communication.sendToAll('ui-state', state.ui);

  // console.log('Load State Completed!');
  // console.log(state);
};

// Run when the browser has been fully exited and opened again.
chrome.runtime.onStartup.addListener(async () => {
  debugger;
  console.log('onStartup');
  await initialize();

  console.log('Continue processing...');
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  debugger;
  console.log('onInstalled');
  await initialize();

  console.log('Continue processing...');

  if (reason === 'install') {

    //const views = chrome.extension.getViews({ type: 'popup' });

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

// var secureChannels: chrome.runtime.Port[] = [];
// var insecureChannels: chrome.runtime.Port[] = [];

// chrome.runtime.onConnect.addListener((port) => {
//   console.log('onConnect:', port);

//   // This is the main channel from extension UI to background.
//   if (port.name === 'extension-channel') {

//   }

//   // Add the new Port to list of secure channels.
//   secureChannels.push(port);

//   // Remove from list when disconnected.
//   port.onDisconnect.addListener(d => {
//     const index = secureChannels.indexOf(d);
//     if (index !== -1) {
//       secureChannels.splice(index, 1);
//     }
//   });

//   port.onMessage.addListener(function (msg) {
//     communication.process(msg);
//     console.log('UI sent us: ', msg);

//     if (msg.method === 'unlock') {
//       utility.password = msg.data;
//       port.postMessage({ method: 'unlocked', data: true });
//     } else if (msg.method == 'unlocked') {
//       if (utility.password) {
//         port.postMessage({ method: 'unlocked', data: true });
//       }
//       else {
//         port.postMessage({ method: 'unlocked', data: false });
//       }
//     } else if (msg.method == 'getlock') {
//       port.postMessage({ method: 'getlock', data: utility.password });
//     } else if (msg.method == 'lock') {
//       utility.password = null;
//       port.postMessage({ method: 'locked' });
//     }

//     // port.postMessage({ answer: 'Yes I will!' });
//   });

//   if (port.sender && port.sender.tab && port.sender.url) {
//     debugger;
//     const tabId = port.sender.tab.id;
//     const url = new URL(port.sender.url);
//     const { origin } = url;
//   }

//   // console.log('onConnect!!', port);
//   // // TODO: Calculate if we are communicating with the extension or untrusted web pages.
//   // const trustedConnection = true;

//   // if (trustedConnection) {

//   //   if (port.name === "app-state") {

//   //   }
//   // }
//   // else {
//   //   console.log('UNTRUSTED CONNECTION!!');

//   // }

// });

chrome.commands.onCommand.addListener((command) => {
  console.log(`Command: ${command}`);
});

chrome.runtime.onSuspend.addListener(function () {
  console.log("Unloading.");
});

// chrome.tabs.getSelected(null, function (tab) {
//   document.body.innerHTML = tab.url;
//   chrome.browserAction.onClicked.addListener(function (tab) {
//     chrome.tabs.create({ url: tab.url });
//   });
// });

chrome.runtime.onMessage.addListener(async (request: any, sender: any, sendResponse: any) => {
  console.log('onMessage (BACKGROUND): ' + JSON.stringify(request));

  if (request.action == 'state') {

  }
  else if (request.action == 'sign' || request.action == 'login' || request.action == 'identity') {

    // chrome.storage.local.get(
    //   { action: null }, // Providing a default if storage is empty
    //   function (data) {
    //     if (!data.action) {
    //       chrome.tabs.sendMessage(sender.tab.id, "login_notification");
    //       chrome.storage.local.set({ action: 'sign' });
    //     }
    //   }
    // );

    console.log(sender);

    await manager.orchestrator.setAction({ action: request.action, document: request.document, tabId: sender.tab.id });

    // TODO: Figure out how to find the top-right of the browser window that activates the popup. https://github.com/block-core/blockcore-extension/issues/10
    var leftPosition = 0;
    var topPosition = 0;

    window.open("index.html", "blockcore_popup", "left=" + leftPosition + ",top=" + topPosition + ",width=440,height=590,status=no,scrollbars=no,resizable=no");

    // orchestrator.setAction('sign').then(() => {
    //   window.open("index.html", "blockcore_popup", "width=440,height=590,status=no,scrollbars=no,resizable=no");
    // });

    // Set the action in storage and open popup.
    // chrome.storage.local.set({ action: 'sign' }, () => {

    // });

  }

  if (request.message == 'buttonClicked') {
    // Create a new tab with options page
    chrome.tabs.create({ 'url': 'chrome://extensions/?options=' + chrome.runtime.id });


    // window.open("chrome-extension://ghipmampnddcpdlppkkamoankmkmcbmh/options.html")

    // chrome..tabs.create({
    //   active: true,
    //   url: 'options.html'
    // }, null);
  }

  sendResponse({ fromcontent: "This message is from content.js" });
});

// MANIFEST V3
// chrome.action.onClicked.addListener(tab => {
//   console.log('onClicked!');
//  });

chrome.alarms.onAlarm.addListener(function (alarm) {
  console.log("Got an alarm!", alarm);
});
