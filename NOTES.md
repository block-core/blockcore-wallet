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

Web Apps auto-load the `provider.ts` when user have the extension installed. This makes "blockcore" available globally through `globalThis.blockcore`.

`content.ts` is responsible for injecting the `provider.ts` into the web app.

Calls are sent through the `provider.ts` using the generic "request" function:

`const result = await blockcore.request({ method: "signMessage", params: [{ message: msg }] });`

The "method" is "action". params can either be a single object, or array. The `provider.ts` will always encapsulate a single object into an array, so
handlers and logic within the extension will only work with empty params or array.

The API is based upon the latest generic interface on MetaMask: https://docs.metamask.io/guide/ethereum-provider.html#ethereum-request-args

Messages from `provider.ts` (using `globalThis.postMessage(msg, '*');`) is initially picked up by `content.ts`, where it is filtered for messages that is coming from the extension.

The handler will take the .data, which is the request object coming from web site, and wrap that together with the `location.host` which will
be the app identifier.

The message is forwarded to `background.ts` using the API: `browser.runtime.sendMessage`.

When the async call (as described in "Action Processing" below) is completed, it will return response to the `provider.ts` using: `window.postMessage(responseMsg, message.origin)`.

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

### Action Types

`RequestArguments`: Definition is same as MetaMask.

```ts
interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}
```

`ActionRequest`: Is used internally and derived from `RequestArguments`.

```ts
interface ActionRequest {
  method: string;
  params: any[];
}
```

`ActionMessage`: Envelope for the request, used internally.

```ts
interface ActionMessage {
  /** The type of action, this is currently limited to `request` */
  type: string;

  /** Data sent from web app. */
  request: ActionRequest;

  target: string;
  source: string;
  ext: string;
  id: string;
  permission?: string;
  app?: string;
  walletId?: string;
  accountId?: string;
  prompt?: boolean;

  /** The internal key ID used to persist permission. */
  keyId?: string;

  /** The public key used to identity the signature returned. */
  key?: string;
}
```

`ActionResponse`: Result provided to the web app.

```ts
interface ActionResponse {
  /** The original request for this response. */
  request: ActionRequest;

  /** The public key user picked for the action. */
  key: string;

  /** The signature for the signed content in base64 encoding. */
  signature: string;

  /** A copy of the actual content string that was signed. */
  content: string;
}
```

## Payment Request


Blockcore Wallet implements BIP21 in a manner that relies on custom HTTP handler in the extension. This means the prefix is different,
and the "bitcoin" prefix (from BIP21) is used to differentiate between networks.

Examples:

```web+pay://bitcoin:175tWpb8K1S7NmH4Zx6rewF9WQrcZv245W?amount=50&label=Luke-Jr&message=Donation%20for%20project%20xyz```

```web+pay://tcrs:tSXDbedw3o79gjijk29dZLNMtcYmymYtoX?amount=2&label=Your Local Info&message=Invoice Number 5```

Extensions to BIP21:

We are adding "data" parameter which will be included in the OP_RETURN data on the transaction. This can in some instances, be the hash 
of the invoice ID or other type of data to be able to track the payment on the merchant end. Data must be base64 encoded byte array.

The other parameter is "id", which is for most use-cases, the same value as "data", except not hashed. This is for local storage and persistence 
of the invoice ID (or other type of identifier the payment requester is giving).

```web+pay://tcrs:tSXDbedw3o79gjijk29dZLNMtcYmymYtoX?amount=2&label=Your Local Info&message=Invoice Number 5&data=MzExMzUzNDIzNDY=&id=4324```

### References:

https://bitcoinqr.dev/

BIP21: https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki

Payment requiest formats: https://bitcoin.design/guide/how-it-works/payment-request-formats/
