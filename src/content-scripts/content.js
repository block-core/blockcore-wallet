chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('onMessage: ' + JSON.stringify(request));
  sendResponse({ fromcontent: "This message is from content.js" });
});
