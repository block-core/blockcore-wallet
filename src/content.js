chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (!sender.tab) {
    console.log('Message from extension:');

    var output = this.document.getElementById('blockcore-extension-output');

    if (output) {
      output.innerText = request.content;
    }
  }
  else {
    console.log('Message from content script:' + sender.tab.url);
  }

  console.log('onMessage (CONTENT): ' + JSON.stringify(request));
  // sendResponse({ fromcontent: "This message is from content.js" });
});

console.log('THIS IS THE EXTENSION CONTENT SCRIPT222!!!');

// chrome.runtime.onStartup.addListener(function () {
//   console.log('onStartup:content');
//   // chrome.storage.local.set({ has_been_notified: false });
// });

// chrome.runtime.onMessage.addListener(
//   function(request, sender, sendResponse) {
//     console.log(sender.tab ?
//                 "from a content script:" + sender.tab.url :
//                 "from the extension");
//     if (request.greeting === "hello")
//       sendResponse({farewell: "goodbye"});
//   }
// );

window.addEventListener("load", function () {
  // alert("Ready state changed");
  console.log("Ready state changed");

  // window.blockcore2 = {
  //   open: () => {
  //     chrome.runtime.sendMessage({ action: "sign" }, function (response) {
  //     });
  //   }
  // };

  // console.log(window.blockcore2);

  var loginButton = this.document.getElementById('blockcore-extension-button');

  var input = this.document.getElementById('blockcore-extension-input');

  if (loginButton) {
    loginButton.getAttribute('')

    loginButton.onclick = () => {
      console.log('LOGIN! Sending message from content to background!');
      console.log(input.value);

      chrome.runtime.sendMessage({
        action: "sign", document: JSON.stringify(input.value)
      }, function (response) {
        console.log(response);
      });
    };
  }

  // var path = document.createElement('button');
  // path.id = 'blockcore-extension-login-button';
  // path.innerText = "Click me!";
  // // path.innerHTML = "<button>Login!!</button>";
  // path.onclick = () => {

  //   // var port = chrome.runtime.connect({ name: "knockknock" });
  //   // port.postMessage({ joke: "Knock knock" });
  //   // port.onMessage.addListener(function (msg) {
  //   //   if (msg.question == "Who's there?")
  //   //     port.postMessage({ answer: "Madame" });
  //   //   else if (msg.question == "Madame who?")
  //   //     port.postMessage({ answer: "Madame... Bovary" });
  //   // });

  // };
  // // path.innerHTML = chrome.extension.getURL('/');
  // // path.style.display = 'none';
  // document.body.appendChild(path);

  // console.log(document.body);

  // var script = document.createElement('script');
  // script.src = chrome.extension.getURL('1.js');
  // document.head.appendChild(script);

  if (!window.blockcore) {
    // const providerUrl = browser.runtime.getURL("provider.js");
    const providerUrl = chrome.runtime.getURL("provider.js");
    // const providerUrl = 'chrome-extension://oebogngphcemipfobgcehenpohfhkhpc/provider.js';
    console.log(providerUrl);

    // Load the JavaScript provided by the extension. We need this to activate the extension.
    var script = document.createElement("script");
    script.src = providerUrl;

    script.onload = function () {
      console.log('Blockcore Provider Script Loaded from Extension.');
    };

    document.head.appendChild(script);
  }


}, false);


// window.addEventListener("mousemove", function () {
//   console.log("mouse moved");

// }, false);