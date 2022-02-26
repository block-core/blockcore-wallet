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
    return;
  };

  try {
    chrome.runtime.sendMessage({
      id: message.data.id,
      type: message.data.type,
      data: message.data.data,
      ext: 'blockcore', // Don't read what is provided by provider script.
      source: 'content', // Don't read what is provided by provider script.
      target: 'tabs', // Don't read what is provided by provider script.
      host: location.host
    }, (response) => {

      // If there was no response provided, set the response to last error.
      if (!response) {
        // We get this exception if we attempt to serialize the whole lastError object (even though it is a basic object?):
        // Error handling response: Error: Failed to execute 'postMessage' on 'Window': An object could not be cloned.
        response = { error: { message: chrome.runtime.lastError.message } };
      }

      // return response and complete the promise.
      window.postMessage({ id: message.data.id, type: message.data.type, ext: 'blockcore', target: 'provider', source: 'content', response }, message.origin);
    });
  }
  catch (error) {
    // TODO: Verify if this is ever raised at all. If the extension window is closed, the browser will log without coming here:
    // "Unchecked runtime.lastError: The message port closed before a response was received.""
    console.log('FAILED TO SEND MESSAGE', error);
    window.postMessage({ id: message.data.id, type: message.data.type, ext: 'blockcore', target: 'provider', source: 'content', response: { error: { message: 'Failed to call extension.' } } }, message.origin);
  }
})
