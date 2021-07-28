chrome.runtime.onInstalled.addListener(() => {
  chrome.webNavigation.onCompleted.addListener(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([{ id }]) => {
      if (id) {
        chrome.pageAction.show(id);
      }
    });
  }, { url: [{ urlMatches: 'blockcore.net' }] });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('onMessage: ' + JSON.stringify(request));
  sendResponse({ fromcontent: "This message is from content.js" });
});
