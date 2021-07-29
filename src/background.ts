chrome.runtime.onInstalled.addListener(() => {

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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('onMessage: ' + JSON.stringify(request));
  sendResponse({ fromcontent: "This message is from content.js" });
});

// MANIFEST V3
// chrome.action.onClicked.addListener(tab => {
//   console.log('onClicked!');
//  });

chrome.alarms.onAlarm.addListener(function (alarm) {
  console.log("Got an alarm!", alarm);
});