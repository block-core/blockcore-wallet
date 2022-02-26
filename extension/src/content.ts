// If the blockcore is not registered yet, load the provider now.
if (!globalThis.blockcore) {
  const providerUrl = chrome.runtime.getURL("provider.js");

  // Load the JavaScript provided by the extension. We need this to activate the extension.
  var script = document.createElement("script");
  script.setAttribute('async', 'false');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', providerUrl)

  script.onload = function () {
    console.log('Blockcore Provider Script Loaded from Extension.');
  };

  document.head.appendChild(script);
}

// chrome.runtime.onMessage.addListener((message, sender, respond) => {
//   const handler = new Promise((resolve, reject) => {
//     if (message) {
//       resolve(`Hi from contentPage! You are currently on: ${window.location.href}`);
//     } else {
//       reject('request is empty.');
//     }
//   });

//   handler.then(m => respond(m)).catch(error => respond(error));

//   return true;
// });

// listen for messages from the provider script
globalThis.addEventListener('message', async message => {

  if (message.source !== window || !message.data || !message.data.ext) {
    return;
  }

  if (message.data.source !== 'provider') {
    console.log('message is NOT from provider. Ignore it!');
    return;
  };

  console.log('globalThis.addEventListener (CONTENT) SEND THIS TO EXTENSION!:', message);

  // pass on to extension
  var response;
  try {
    response = await chrome.runtime.sendMessage({
      id: message.data.id,
      type: message.data.type,
      data: message.data.data,
      ext: 'blockcore', // Don't read what is provided by provider script.
      source: 'content', // Don't read what is provided by provider script.
      target: 'tabs', // Don't read what is provided by provider script.
      host: location.host
    });

    console.log('SEND MESSAGE FINISHED....');
  } catch (error) {
    console.log('WHUYT!');
    response = { error }
  }

  // TODO: FIGURE OUT WHY RESPONSE IS NULL!!!??!
  console.log('RESPONSE FROM TABS RECEIVED BY CONTENT:', response);

  // return response and complete the promise.
  window.postMessage({ id: message.data.id, type: message.data.type, ext: 'blockcore', target: 'provider', source: 'content', response }, message.origin)
})


// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   if (!sender.tab) {
//     console.log('Message from extension:');

//     var output = this.document.getElementById('blockcore-extension-output');

//     if (output) {
//       output.innerText = request.content;
//     }
//   }
//   else {
//     console.log('Message from content script:' + sender.tab.url);
//   }

//   console.log('onMessage (CONTENT): ' + JSON.stringify(request));
//   // sendResponse({ fromcontent: "This message is from content.js" });
// });

// console.log('THIS IS THE EXTENSION CONTENT SCRIPT222!!!');

// // chrome.runtime.onStartup.addListener(function () {
// //   console.log('onStartup:content');
// //   // chrome.storage.local.set({ has_been_notified: false });
// // });

// // chrome.runtime.onMessage.addListener(
// //   function(request, sender, sendResponse) {
// //     console.log(sender.tab ?
// //                 "from a content script:" + sender.tab.url :
// //                 "from the extension");
// //     if (request.greeting === "hello")
// //       sendResponse({farewell: "goodbye"});
// //   }
// // );

// window.addEventListener("load", function () {
//   // alert("Ready state changed");
//   console.log("Ready state changed");

//   // window.blockcore2 = {
//   //   open: () => {
//   //     chrome.runtime.sendMessage({ action: "sign" }, function (response) {
//   //     });
//   //   }
//   // };

//   // console.log(window.blockcore2);

//   var buttons = document.getElementsByClassName('blockcore-extension-button'); // .getElementById('blockcore-extension-button');
//   var input = document.getElementById('blockcore-extension-input');

//   console.log(buttons);

//   if (buttons) {

//     Array.from(buttons).forEach((button) => {
//       let purpose = button.getAttribute('purpose');

//       button.onclick = () => {
//         console.log('LOGIN! Sending message from content to background!');
//         console.log(input.value);

//         chrome.runtime.sendMessage({
//           action: purpose, document: JSON.stringify(input.value)
//         }, function (response) {
//           console.log(response);
//         });
//       };
//     });

//     // Array.forEach()
//     // var testDivs = Array.prototype.filter.call(buttons, function (button) {
//     // });
//     // buttons.forEach(button => {
//     // });
//   }

//   // var path = document.createElement('button');
//   // path.id = 'blockcore-extension-login-button';
//   // path.innerText = "Click me!";
//   // // path.innerHTML = "<button>Login!!</button>";
//   // path.onclick = () => {

//   //   // var port = chrome.runtime.connect({ name: "knockknock" });
//   //   // port.postMessage({ joke: "Knock knock" });
//   //   // port.onMessage.addListener(function (msg) {
//   //   //   if (msg.question == "Who's there?")
//   //   //     port.postMessage({ answer: "Madame" });
//   //   //   else if (msg.question == "Madame who?")
//   //   //     port.postMessage({ answer: "Madame... Bovary" });
//   //   // });

//   // };
//   // // path.innerHTML = chrome.extension.getURL('/');
//   // // path.style.display = 'none';
//   // document.body.appendChild(path);

//   // console.log(document.body);

//   // var script = document.createElement('script');
//   // script.src = chrome.extension.getURL('1.js');
//   // document.head.appendChild(script);

//   if (!window.blockcore) {
//     // const providerUrl = browser.runtime.getURL("provider.js");
//     const providerUrl = chrome.runtime.getURL("provider.js");
//     // const providerUrl = 'chrome-extension://oebogngphcemipfobgcehenpohfhkhpc/provider.js';
//     console.log(providerUrl);

//     // Load the JavaScript provided by the extension. We need this to activate the extension.
//     var script = document.createElement("script");
//     script.src = providerUrl;

//     script.onload = function () {
//       console.log('Blockcore Provider Script Loaded from Extension.');
//     };

//     document.head.appendChild(script);
//   }


// }, false);


// // window.addEventListener("mousemove", function () {
// //   console.log("mouse moved");

// // }, false);