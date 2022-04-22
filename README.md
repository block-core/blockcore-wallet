# Blockcore Wallet

###  Web Browser Extension for crypto wallet in your browser for coins, tokens, identities, NFTs and more.

The Blockcore Extension does wallet management, account management, identity management and signing.

![](/doc/blockcore-extension-walkthrough.gif)

## Instances

This extension is made available in multiple different instances that has different featuresets:

### Blockcore

- Chains: All Blockcore supported blockchains
- All features currently under development
- Download: ["blockcore-*.zip](https://github.com/block-core/blockcore-extension/releases)

### CoinVault

- Chains: Stratis and Cirrus.
- Features: Wallet, NFT and more.
- Download: ["coinvault-*.zip](https://github.com/block-core/blockcore-extension/releases)

### Smart City Platform

- Chains: City Chain
- Features: Focused on decentralized citizenship
- Download: ["smartcityplatform-*.zip](https://github.com/block-core/blockcore-extension/releases)

## Supported Browsers

The extension works on Chrome and Edge browsers. Future FireFox support might be added later.

## WARNING AND RISK

This software should be considered experimental, use at your own risk.

All the standard practices for cryptocurrency wallets apply: Make sure you take backup of your secret recovery phrase. We are not responsible for any mistakes or problems with the software and services. You hold your own keys, we can never restore or help you if you loose your secret recovery phrase. You can still loose valuables even though you don't loose your recovery phrase, due to bugs and issues in the software provided. Use at your own risk.

# Development

## Requirements

- Node.js LTS (16.x): https://nodejs.org/en/
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

## Mobile Debugging

Supports Android and iOS. Running Android (Windows):

```
npx cap run android
```

You can also open the Android code in Android Studio:

```
npx cap open android
```

You can debug the active running app, using Chrome on the hosting device by opening this url: `chrome://inspect/#devices`