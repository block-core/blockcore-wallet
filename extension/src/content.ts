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
    if (message.source !== window) return;
    if (!message.data) return;
    if (!message.data.params) return;
    if (message.data.extension !== 'blockcore') return;

    var response;
    try {
      console.log('SENDING MESSAGE!!');
      response = await chrome.runtime.sendMessage({
        type: message.data.type,
        params: message.data.params,
        extension: 'blockcore',
        source: 'content',
        target: 'tabs', // tabs = extension windows, popups, tabs.
        host: location.host,
      });
    } catch (error) {
      response = { error };
    }

    window.postMessage(
      {
        id: message.data.id,
        type: message.data.type,
        extension: 'blockcore',
        source: 'content',
        target: 'provider',
        host: location.host,
        response,
      },
      message.origin
    );
  });
}
