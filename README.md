# Web Browser Extension for Blockcore

Basic shell for our web browser extension for digital signing, web site login and more.

The Blockcore Extension does basic wallet management, account management, identity management and signing.

![](/doc/blockcore-extension-walkthrough.gif)

## Supported Browsers

The extension works on Chrome and Edge browsers. Future FireFox support might be added later.

## Development Requirements

- Node.js 14.x: https://nodejs.org/en/
- Angular CLI: `npm install -g @angular/cli`

## Run with Hot-Reload

```sh
npm install
npm start
```

This will run Angular in watch-mode and ensure it auto-reloads.

## Install Extension

To install the extension, follow the instructions here: https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading

Choose the `blockcore-extension\dist\blockcore-extension` folder when picking folder for extension to load from.

## Manifest V2

The Blockcore Extension is built using V2 of the manifest file format: https://developer.chrome.com/docs/extensions/mv2/

We should migrate to V3 when possible: https://developer.chrome.com/docs/extensions/mv3/manifest/
