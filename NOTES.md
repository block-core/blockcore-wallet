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

