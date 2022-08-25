# Blockcore Wallet: Notes

## Developer, architecture and technical notes for the implementation of Blockcore Wallet

This document is used to document and capture some of the decisions that is being made during development of Blockcore Wallet.

It's separate from user documentation, as the instructions here can be technical.

### Data Stores

The address state has previously been connected to the accounts and accounts to wallets, so persistance of either of those structures
could result in race-conditions where the blockchain data indexing would update and persist data that would override user actions in the UI.

Address state was separated from the account and account from wallet, to ensure that data structures have well-defined origins of modifications.

## Watcher

When performing a transaction send, we need to more rapidly send API requests to update the state of the account. There are different rules
that is being applied in the watcher:

- A transaction that is observed is tracked until it's state is finalized, which it is after 500 confirmations.
- All affected addresses are collected when performing a send, these are what the watcher is looking into, in addition to the latest (or single)
  receive address and change address.
- In extension mode, the background service worker can be put into idle state at any time. There are two alarm timers that will make it up, but
  these are not deterministic. As long as the UI is open, the UI will send "keep-alive" message to the service worker.
- All API requests against the indexers are performed with a maximum of 3 retries with exponential delay. This will help mitigate various network
  and service issues. This is handled by the axios-retry plugin.

## Action Process

Web Apps auto-load the `provider.ts` when user have the extension installed. This makes "blockcore" available globally through globalThis.blockcore.

`content.ts` is responsible for injecting the `provider.ts` into the web app.

Calls are sent through the `provider.ts` using the generic "request" function:

`const result = await blockcore.request({ method: "signMessage", params: [{ message: msg }] });`

The "method" is "action". params can either be a single object, or array.

The API is based upon the latest generic interface on MetaMask: https://docs.metamask.io/guide/ethereum-provider.html#ethereum-request-args

Messages from `provider.ts` (using `globalThis.postMessage(msg, '*');`) is initially picked up by `content.ts`, where it is filtered for messages that is coming from the extension.

The handler will take the .data, which is the request object coming from web site, and wrap that together with the `location.host` which will 
be the app identifier.

The message is forwarded to `background.ts` using the API: `browser.runtime.sendMessage`.

When the async call is completed, it will return response to the `provider.ts` using: `window.postMessage(responseMsg, message.origin)`.

The `provider.ts` will then return response to the web app in the handler: `globalThis.addEventListener('message'`, which will filter out messages that is not 
relevant for the extension.

### Action Processing

The processing of action requests happens in `background.ts`, as described in the section above.

There is an handler for `browser.runtime.onMessage.addListener` which handles messages that arrives both from the `content.ts`, but also from the extension (Angular) 
itself. If the message contains the field `prompt`, it will be handled as response from the popup-prompt that extension has rendered.

`handlePromptMessage` handles messages from extension.

`handleContentScriptMessage` handles messages from `content.ts`.

When handling action messages, the first thing created is an instance of `ActionState`, which is an object that holds all relevant state information about the action.

Then an action handler is created, which is an object that is responsible for doing the actual work of signing, encryption, decryption, etc.

First the `prepare` method is called on the handler. This results in an object that will be displayed to the user, if permission is not available. Prepare should be used 
to construct dynamic content to be signed by the user.

Then permission is attempted to be retrieved, which might result in a prompt. The permission object has information about wallet, account and key ID that user want to 
assign to the action.

If permission is given, then `execute` is called on the handler. The result from execute is returned as described in the previous section above.
