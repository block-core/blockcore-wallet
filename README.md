# Blockcore Wallet

### Non-Custodial Web5 Wallet for your Browser

The Blockcore Wallet does wallet management, account management, identity management and signing. Built on web-technology, Blockcore Wallet is cross-platform and works in
different modes, such as browser extension, Progressive Web App, native mobile and desktop app and more.

Open the [Wallet Guide](https://www.blockcore.net/wallet/guide) to install the wallet.

![](/doc/wallet-create-wallet.gif)

## Features

The wallet supports having multiple active wallets at the same time, and each wallet can contain one or more accounts, even on different blockchains and networks.

- [x] Multiple wallets with multiple accounts
- [x] Web5 wallet for identity and data
- [x] Payment requests
- [x] Decentralized blockchain API discovery
- [x] Internationalization support with multiple languages and LTR/RTL support.
- [x] Nostr support

## Browser Support
Blockcore Wallet supports all Chromium based browsers - Chrome, Edge Opera, Brave etc.

Firefox is not supported. Support for Firefox is not planned.

### Normal vs Quick

When adding additional accounts to your wallet, you have the option to choose the modes `Normal` and `Quick`. The difference can be very important depending on your usage and needs.

`Normal` will retrieve all transaction history for your wallet, and calculate the balance locally. When sending transactions, the available unspent transaction outputs (UTXOs) are queried locally in the history of data.

`Quick` will retrieve only the current balance information from the indexer APIs, even for very large wallets, this is very quick to do. When sending transactions, the indexer API is queried until the amount being sent has been fulfilled. This means even if you have thousands of UTXOs, the wallet does not need to download all the data to perform transactions.

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

### Free City Wallet

- Chains: City Chain
- Features: Focused on decentralized citizenship
- Download: ["smartcityplatform-\*.zip](https://github.com/block-core/blockcore-wallet/releases)

## Supported Browsers

The extension works on Chrome and Edge browsers. Future Firefox support might be added later.

## WARNING AND RISK

This software should be considered experimental, use at your own risk.

All the standard practices for cryptocurrency wallets apply: Make sure you take backup of your secret recovery phrase. We are not responsible for any mistakes or problems with the software and services. You hold your own keys, we can never restore or help you if you lose your secret recovery phrase. You can still lose valuables even though you don't lose your recovery phrase, due to bugs and issues in the software provided. Use at your own risk.

# Development

First you need to get the source code and you should include the submodules:

```
git clone --recurse-submodules https://github.com/block-core/blockcore-wallet.git
```

If you have already cloned and don't have the submodules, you might get an error with importing the lists.

You can do the following to initialize the submodules if you cloned without --recurse-submodules.

```
git submodule init
git submodule update
```

## Requirements

- Node.js LTS (16.x): https://nodejs.org/en/
- Angular CLI: `npm install -g @angular/cli`
- Install the suggested workspace extensions for VS Code

## Code Formatting Rules

Please use an editor that respects the .editorconfig when auto-formatting the code.

If formatting is not applied according to the rules, make sure you don't have configuration in user settings for VS Code: `%APPDATA%\Code\User\settings.json`

## Run with Hot-Reload

```sh
npm install
npm start
```

This will run Angular in watch-mode and ensure it auto-reloads.

## Install Extension

To install the extension, follow the instructions here: https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading

Choose the `blockcore-wallet\dist\extension` folder when picking folder for extension to load from.

## Update Allow/Deny lists

The `lists` is a git submodule and to update to latest:

```sh
git submodule update --remote --merge
```
