chrome.runtime.onInstalled.addListener(({ reason }) => {
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

chrome.runtime.onInstalled.addListener(() => {

  console.log('INSTALLED!!!');

  // chrome.webNavigation.onCompleted.addListener(() => {
  //     console.log('onInstalled:onCompleted');

  //     chrome.tabs.query({ active: true, currentWindow: true }, ([{ id }]) => {
  //       if (id) {
  //         chrome.pageAction.show(id);
  //       }
  //   });

  // }, {
  //   url: [{ urlMatches: 'blockcore.net' }]
  // });

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

  if (request.action == 'sign') {

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