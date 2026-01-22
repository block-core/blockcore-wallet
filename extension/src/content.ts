import * as browser from 'webextension-polyfill';
import { ActionMessage } from '../../angular/src/shared';
import { DomainVerification } from '../../angular/src/shared';

// Guard to prevent multiple injections in the same context
// Content scripts run in isolated world, so we use a unique property
const INJECTION_GUARD = '__blockcore_content_injected__';
if ((globalThis as any)[INJECTION_GUARD]) {
  // Already injected, skip
} else {
  (globalThis as any)[INJECTION_GUARD] = true;

  // Function to inject provider script into page's MAIN world
  function injectProvider() {
    const scriptUrl = browser.runtime.getURL('provider.js');
    
    // Method 1: Try to inject via script src (works on most sites)
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = false;
    script.onload = () => {
      script.remove();
    };
    script.onerror = () => {
      // Method 2: If src fails due to CSP, try fetching and inline injection
      console.log('Fallback to inline script injection');
      fetch(scriptUrl)
        .then(response => response.text())
        .then(scriptContent => {
          const inlineScript = document.createElement('script');
          inlineScript.textContent = scriptContent;
          (document.head || document.documentElement).appendChild(inlineScript);
          inlineScript.remove();
        })
        .catch(error => {
          console.error('Failed to load provider script:', error);
        });
    };
    
    (document.head || document.documentElement).appendChild(script);
  }

  // Verify the domain
  let verify = DomainVerification.verify(window.location.host);

  if (verify == false) {
    console.warn('The host is part of deny list and the extension will not be allowed to load.');
  } else {
    if (verify == true) {
      console.log('The domain is approved.');
    } else {
      console.log('The domain is unknown, allow loading.');
    }

    // Inject the provider script into the page's MAIN world
    injectProvider();

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
        if (browser.runtime?.id) {
          response = await browser.runtime.sendMessage(msg);
          console.log('CONTENT: Got response from background:', response);
        } else {
          console.warn('The extension has been updated and context is lost. Page requires reload.');
          location.reload();
          return;
        }
      } catch (error: any) {
        console.error('CONTENT: Error sending message to background:', error);
        response = { error: { message: error.message, stack: error.stack } };
      }

      // Always send a response back, even if it's null/undefined
      const responseMsg: ActionMessage = { ...data, response: response ?? { error: { message: 'No response from background' } } };
      responseMsg.target = 'provider';

      console.log('CONTENT: Sending response to provider:', responseMsg);
      
      // Return the response to the provider/caller.
      window.postMessage(responseMsg, message.origin);
    });
  }
}
