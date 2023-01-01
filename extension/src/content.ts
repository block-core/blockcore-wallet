import * as browser from 'webextension-polyfill';
import { ActionMessage } from '../../angular/src/shared';
import { DomainVerification } from '../../angular/src/shared';

// If the blockcore is not registered yet, load the provider now.
if (!globalThis.blockcore) {
  // This verification is not enough, any website can always reference an extension directly and load the provider.js, so
  // we need additional verification in the background.ts
  let verify = DomainVerification.verify(window.location.host);

  if (verify == false) {
    console.warn('The host is part of deny list and the extension will not be allowed to load.');
  } else {
    if (verify == true) {
      console.log('The domain is approved.');
    } else {
      console.log('The domain is unknown, allow loading.');
    }

    // Load the JavaScript provided by the extension. We need this to activate the extension.
    let script = document.createElement('script');
    script.setAttribute('async', 'false');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', chrome.runtime.getURL('provider.js'));
    document.head.appendChild(script);

    script.onload = function () {
      // console.log('Blockcore Provider Script Loaded from Extension.');
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
        if (chrome.runtime?.id) {
          response = await browser.runtime.sendMessage(msg);
        } else {
          console.warn('The extension has been updated and context is lost. Page requires reload.');
          // TODO: Can we re-inject script in the caller? Should we display a popup in the DOM of the website?
          location.reload();
        }
      } catch (error) {
        response = { error };
      }

      const responseMsg: ActionMessage = { ...data, response };
      responseMsg.target = 'provider';

      // Return the response to the provider/caller.
      window.postMessage(responseMsg, message.origin);
    });
  }
}
