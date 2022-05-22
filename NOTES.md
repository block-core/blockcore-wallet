# Blockcore Wallet: Notes

## Different developer, architecture and technical notes for the implementation of Blockcore Wallet

This document is used to document and capture some of the decisions that is being made during development of Blockcore Wallet.

It's separate from user documentation, as the instructions here can be technical.

### Data Stores

The address state has previously been connected to the accounts and accounts to wallets, so persistance of either of those structures
could result in race-conditions where the blockchain data indexing would update and persist data that would override user actions in the UI.

Address state was separated from the account and account from wallet, to ensure that data structures have well-defined origins of modifications.
