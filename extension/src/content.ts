import * as browser from 'webextension-polyfill';
import { ActionMessage } from '../../angular/src/shared';

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

    const data = message.data as ActionMessage;

    if (data.ext !== 'blockcore') return; // We'll only handle messages marked with extension 'blockcore'.
    if (data.target !== 'tabs') return; // We'll only forward messages that has target tabs.

    const msg = { ...data, app: location.host };
    let response: any | null = null;

    try {
      // Send the message to background service:
      response = await browser.runtime.sendMessage(msg);
    } catch (error) {
      response = { error };
    }

    const responseMsg: ActionMessage = { ...data, response: response };
    responseMsg.target = 'provider';

    // Return the response to the provider/caller.
    window.postMessage(responseMsg, message.origin);
  });
}
