# Blockcore Wallet

### Wallet for your coins, tokens, identities, NFTs and more.

The Blockcore Wallet does wallet management, account management, identity management and signing. Built on web-technology, Blockcore Wallet is cross-platform and works in
different modes, such as browser extension, Progressive Web App, native mobile and desktop app and more.

![](/doc/blockcore-extension-walkthrough.gif)

## Features

The wallet supports having multiple active wallets at the same time, and each wallet can contain one or more accounts, even on different blockchains and networks.

### Normal vs Quick

When adding additional accounts to your wallet, you have the option to choose the modes `Normal` and `Quick`. The difference can be very important depending on your usage and needs.

`Normal` will retrieve all transaction history for your wallet, and calculate the balance locally. When sending transactions, the available unspent transaction outputs (UTXOs) are queried locally in the history of data.

`Quick` will retrieve only the current balance information from the indexer APIs, even for very large wallets, this is very quick to do. When sending transactions, the indexer API is queried until the amount being sent has been fullfilled. This means even if you have thousands of UTXOs, the wallet does not need to download all the data to perform transactions.

## Instances

This wallet is made available in multiple different instances that has different featuresets:

### Blockcore

- Chains: All Blockcore supported blockchains
- All features currently under development
- Download: ["blockcore-\*.zip](https://github.com/block-core/blockcore-wallet/releases)

### CoinVault

- Chains: Stratis and Cirrus.
- Features: Wallet, NFT and more.
- Download: ["coinvault-\*.zip](https://github.com/block-core/blockcore-wallet/releases)

### Smart City Platform

- Chains: City Chain
- Features: Focused on decentralized citizenship
- Download: ["smartcityplatform-\*.zip](https://github.com/block-core/blockcore-wallet/releases)

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

1. Install the Android Studio
2. Set the JAVA_HOME path to `C:\Program Files\Android\Android Studio\jre`

Supports Android and iOS. Running Android (Windows):

```
npx cap run android
```

You can also open the Android code in Android Studio:

```
npx cap open android
```

You can debug the active running app, using Chrome on the hosting device by opening this url: `chrome://inspect/#devices`

## Desktop(electron) Debugging

First build the wallet from root:

```
npm run build:angular-production
```

Then navigate into the `electron` folder and run:

```
npm install
npm start
# npm run release
```
