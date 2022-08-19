import * as browser from 'webextension-polyfill';

// If the blockcore is not registered yet, load the provider now.
if (!globalThis.blockcore) {
  // Load the JavaScript provided by the extension. We need this to activate the extension.
  let script = document.createElement('script');
  script.setAttribute('async', 'false');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', chrome.runtime.getURL('provider.js'));
  document.head.appendChild(script);

  script.onload = function () {
    console.log('Blockcore Provider Script Loaded from Extension.');
  };

  // listen for messages from the provider script
  window.addEventListener('message', async (message) => {
    // console.log('CONTENT:MSG:', message);
    if (!message.data) return;
    if (message.source !== window) return;
    if (message.data.ext !== 'blockcore') return; // We'll only handle messages marked with extension 'blockcore'.
    if (message.data.target !== 'tabs') return; // We'll only forward messages that has target tabs.

    const msg = { ...message.data, app: location.host };
    msg.isFromContent = true;
    let response: any | null = null;

    try {
      // Send the message to background service:
      response = await browser.runtime.sendMessage(msg);
    } catch (error) {
      response = { error };
    }

    const responseMsg = { ...message.data, response: response };
    responseMsg.target = 'provider';

    // Return the response to the provider/caller.
    window.postMessage(responseMsg, message.origin);
  });
}
