// class ApplicationState {

// }

import { CryptoUtility } from './background/crypto-utility';

const utility = new CryptoUtility();

chrome.runtime.onInstalled.addListener(({ reason }) => {

  console.log('INSTALLED!!!');

  if (reason === 'install') {

    //const views = chrome.extension.getViews({ type: 'popup' });

    var popups = chrome.extension.getViews({ type: "popup" });
    if (popups.length != 0) {
      console.log('FOUND A POPUP!!');
      var popup = popups[0];
      // popup.doSomething();
    }
    else {
      console.log('No POPUP!?!!');
    }

    // chrome.runtime.

    // Open a new tab for initial setup.
    chrome.tabs.create({ url: "index.html" });

  }
});

var secureChannels: chrome.runtime.Port[] = [];
var insecureChannels: chrome.runtime.Port[] = [];

chrome.runtime.onConnectExternal.addListener((port) => {
  console.log('onConnectExternal:', port);

  // Add the new Port to list of insecure channels (external connections from web pages or other extensions).
  insecureChannels.push(port);

  // Remove from list when disconnected.
  port.onDisconnect.addListener(d => {
    const index = insecureChannels.indexOf(d);
    if (index !== -1) {
      insecureChannels.splice(index, 1);
    }
  });

  port.onMessage.addListener(function (msg) {
    console.log('You sent us: ', msg);

    // We will only allow certain messages to be forwarded.
    if (msg.method == 'requestAccounts') {

      // TODO: Add validation (stripping) of input, perhaps some third party library that exists for it?
      const data = JSON.stringify(msg.data);
      const validData = JSON.parse(data);

      for (const p of secureChannels) {
        console.log(p.postMessage({ method: 'requestAccounts', data: validData }));
      }
    }

    port.postMessage({ response: 'You have connected and we will forward your messages to the app.' });
  });

});

chrome.runtime.onConnect.addListener((port) => {
  console.log('onConnect:', port);

  // Add the new Port to list of secure channels.
  secureChannels.push(port);

  // Remove from list when disconnected.
  port.onDisconnect.addListener(d => {
    const index = secureChannels.indexOf(d);
    if (index !== -1) {
      secureChannels.splice(index, 1);
    }
  });

  port.onMessage.addListener(function (msg) {
    console.log('UI sent us: ', msg);

    if (msg.method === 'unlock') {
      utility.password = msg.data;
      port.postMessage({ method: 'unlocked', data: true });
    } else if (msg.method == 'unlocked') {
      if (utility.password) {
        port.postMessage({ method: 'unlocked', data: true });
      }
      else {
        port.postMessage({ method: 'unlocked', data: false });
      }
    } else if (msg.method == 'getlock') {
      port.postMessage({ method: 'getlock', data: utility.password });
    } else if (msg.method == 'lock') {
      utility.password = null;
      port.postMessage({ method: 'locked'});
    }

    // port.postMessage({ answer: 'Yes I will!' });
  });

  if (port.sender && port.sender.tab && port.sender.url) {
    debugger;
    const tabId = port.sender.tab.id;
    const url = new URL(port.sender.url);
    const { origin } = url;
  }

  // console.log('onConnect!!', port);
  // // TODO: Calculate if we are communicating with the extension or untrusted web pages.
  // const trustedConnection = true;

  // if (trustedConnection) {

  //   if (port.name === "app-state") {

  //   }
  // }
  // else {
  //   console.log('UNTRUSTED CONNECTION!!');

  // }

});


chrome.commands.onCommand.addListener((command) => {
  console.log(`Command: ${command}`);
});

chrome.runtime.onStartup.addListener(function () {
  console.log('onStartup:background');
  // chrome.storage.local.set({ has_been_notified: false });
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

chrome.runtime.onMessage.addListener(function (request, sender: any, sendResponse) {

  console.log('onMessage (BACKGROUND): ' + JSON.stringify(request));

  if (request.action == 'state') {

  }
  else if (request.action == 'sign') {

    // chrome.storage.local.get(
    //   { action: null }, // Providing a default if storage is empty
    //   function (data) {
    //     if (!data.action) {
    //       chrome.tabs.sendMessage(sender.tab.id, "login_notification");
    //       chrome.storage.local.set({ action: 'sign' });
    //     }
    //   }
    // );

    // Set the action in storage and open popup.
    chrome.storage.local.set({ action: 'sign' }, () => {
      window.open("index.html", "blockcore_popup", "width=440,height=590,status=no,scrollbars=no,resizable=no");
    });

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

// chrome.runtime.onConnect.addListener(function (port) {
//   console.assert(port.name == "knockknock");
//   port.onMessage.addListener(function (msg) {
//     if (msg.joke == "Knock knock")
//       port.postMessage({ question: "Who's there?" });
//     else if (msg.answer == "Madame")
//       port.postMessage({ question: "Madame who?" });
//     else if (msg.answer == "Madame... Bovary")
//       port.postMessage({ question: "I don't get it." });
//   });
// });