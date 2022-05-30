import axiosRetry from 'axios-retry';
import { AddressState, Transaction } from '.';
import { AddressManager } from './address-manager';
import { ProcessResult } from './background-manager';
import { AccountUnspentTransactionOutput, AddressIndexedState, TransactionHistory } from './interfaces';
import { AccountHistoryStore, AddressStore, SettingStore, TransactionStore, WalletStore } from './store';
import { AccountStateStore } from './store/account-state-store';
import { AddressIndexedStore } from './store/address-indexed-store';
import { AddressWatchStore } from './store/address-watch-store';
import { RunState } from './task-runner';

//const axios = require('axios');
// In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with require() use the following approach:
const axios = require('axios').default;
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

/** Service that handles queries against the blockchain indexer to retrieve data for accounts. Runs in the background. */
export class IndexerBackgroundService {
    private limit = 20;
    private finalized = 500;
    private confirmed = 1;

    /** The height at which we will stop watching. */
    private watch = 6;

    /** The maximum number of times we'll attempt to watch an address before it's wiped from the watch list. */
    private maxWatch = 500;

    /** We will attempt to query the address at minimum 10 times before we check the latest transactions if we should quit. */
    private minWatchCount = 20;

    /** The number of entries pr. address to process before updating the UI with partially indexed data. This won't affect
     * large wallets that have a single transaction pr. address and many addresses, but it will make large staker/miner wallets
     * work much better.
     */
    private batchSize = 50;

    constructor(
        private settingStore: SettingStore,
        private walletStore: WalletStore,
        private addressStore: AddressStore,
        private addressIndexedStore: AddressIndexedStore,
        private transactionStore: TransactionStore,
        private addressManager: AddressManager,
        private accountStateStore: AccountStateStore,
        private accountHistoryStore: AccountHistoryStore
    ) {

    }

    public runState: RunState;

    async calculateBalance() {
        // Then calculate the balance.
        const wallets = this.walletStore.all();
        const addressStates = this.addressStore.all();
        const transactions = this.transactionStore.all();
        const addressIndexedStates = this.addressIndexedStore.all();

        for (let i = 0; i < wallets.length; i++) {
            const wallet = wallets[i];

            // Then calculate the balance.
            const accounts = wallet.accounts;

            for (let j = 0; j < accounts.length; j++) {
                const account = accounts[j];
                const accountState = this.accountStateStore.get(account.identifier);

                if (account.mode === 'quick') {

                    let totalBalance = 0;

                    const allAddresses = this.accountStateStore.getAllAddresses(account.identifier);
                    // const allAddresses = [...account.state.receive.map(a => a.address), ...account.state.change.map(a => a.address)];
                    const filteredAddressIndexedStates = addressIndexedStates.filter(a => allAddresses.indexOf(a.address) > -1);
                    filteredAddressIndexedStates.map(a => totalBalance += a.balance);

                    this.accountHistoryStore.set(account.identifier, {
                        history: [],
                        unspent: [],
                        balance: totalBalance,
                        unconfirmed: 0
                    });

                    await this.accountHistoryStore.save();

                } else {
                    const addresses = this.accountStateStore.getAllAddresses(account.identifier);
                    const addressStatesInThisAccount = addressStates.filter(a => addresses.indexOf(a.address) > -1);
                    const transactionHashesInAccount = addressStatesInThisAccount.flatMap(a => a.transactions);
                    var uniqueTransactionHashes = Array.from(new Set(transactionHashesInAccount));
                    let transactionsInThisAccount = transactions.filter(a => uniqueTransactionHashes.indexOf(a.transactionHash) > -1);

                    // Sort the transaction, the array is by-ref so it will sort the original values. Sort the unconfirmed on top.
                    transactionsInThisAccount = transactionsInThisAccount.sort((a: any, b: any) => {
                        let index1 = a.blockIndex;
                        let index2 = b.blockIndex;

                        if (index1 == 0) index1 = 9007199254740991;
                        if (index2 == 0) index2 = 9007199254740991;

                        if (index1 < index2) return 1;
                        if (index1 > index2) return -1;
                        return 0;
                    });

                    let accountHistory = transactionsInThisAccount.map(t => {
                        const tx = {} as TransactionHistory | any;

                        tx.blockIndex = t.blockIndex;
                        tx.unconfirmed = t.unconfirmed;
                        tx.finalized = t.finalized;
                        tx.transactionHash = t.transactionHash;
                        tx.timestamp = t.details.timestamp;
                        tx.isCoinstake = t.details.isCoinstake;
                        tx.isCoinbase = t.details.isCoinbase;
                        tx.fee = t.details.fee;

                        const externalOutputs = t.details.outputs.filter(o => addresses.indexOf(o.address) === -1);
                        const internalOutputs = t.details.outputs.filter(o => addresses.indexOf(o.address) > -1);
                        const externalInputs = t.details.inputs.filter(o => addresses.indexOf(o.inputAddress) === -1);
                        const internalInputs = t.details.inputs.filter(o => addresses.indexOf(o.inputAddress) > -1);

                        // Check if there is any external outputs or inputs. If not, user is sending to themselves:
                        if (externalOutputs.length == 0 && externalInputs.length == 0) {
                            tx.entryType = 'consolidated';
                            tx.calculatedAddress = internalOutputs.map(o => o.address).join(';');
                        } else {

                            // If there are no internal inputs, it means we received.
                            if (internalInputs.length == 0) {
                                tx.entryType = 'receive';

                                let receivedAmount = 0;
                                const outputs = internalOutputs.map(x => x.balance);

                                // Reduce on empty array crashes.
                                if (outputs.length > 0) {
                                    receivedAmount = outputs.reduce((x: any, y: any) => x + y);
                                }

                                tx.calculatedValue = receivedAmount;
                                tx.calculatedAddress = internalOutputs.map(o => o.address).join(';');
                            } else {
                                tx.entryType = 'send';

                                let amount = 0;
                                const outputs = externalOutputs.map(x => x.balance);

                                if (outputs.length > 0) {
                                    amount = outputs.reduce((x: any, y: any) => x + y);
                                }

                                tx.calculatedValue = amount;
                                tx.calculatedAddress = externalOutputs.map(o => o.address).join(';');
                            }

                            if (tx.isCoinbase) {
                                tx.entryType = 'mine';
                            } else if (tx.isCoinstake) {
                                tx.entryType = 'stake';
                            }

                            if (t.details.outputs.length == 2) {
                                if (t.details.outputs[0].outputType == "OP_CALLCONTRACT")
                                    tx.hasContract = true;

                                if (t.details.outputs[0].outputType == "OP_CREATECONTRACT")
                                    tx.hasContract = true;

                                if (t.details.outputs[0].outputType == "OP_INTERNALCONTRACTTRANSFER")
                                    tx.hasContract = true;

                                if (t.details.outputs[1].outputType == "OP_CALLCONTRACT")
                                    tx.hasContract = true;

                                if (t.details.outputs[1].outputType == "OP_CREATECONTRACT")
                                    tx.hasContract = true;

                                if (t.details.outputs[1].outputType == "OP_INTERNALCONTRACTTRANSFER")
                                    tx.hasContract = true;
                            }
                        }

                        return tx;
                    });

                    let utxos: AccountUnspentTransactionOutput[] = [];

                    // Loop through the transactions by looking at the oldest first.
                    for (let i = transactionsInThisAccount.length - 1; i >= 0; i--) {
                        const t = transactionsInThisAccount[i];

                        const internalOutputs = t.details.outputs.filter(o => addresses.indexOf(o.address) > -1);

                        for (let j = 0; j < internalOutputs.length; j++) {
                            const utxo = internalOutputs[j];

                            // Check if the outputs (UTXO at this point in time) is spent in any future transactions:
                            let spentOutputs = transactionsInThisAccount.filter(product => product.details.inputs.some(i => i.inputAddress == utxo.address && i.inputIndex == utxo.index && i.inputTransactionId == t.transactionHash));

                            if (spentOutputs.length === 0) {
                                const transaction = this.transactionStore.get(t.transactionHash);

                                utxos.push({
                                    address: utxo.address,
                                    balance: utxo.balance,
                                    index: utxo.index,
                                    transactionHash: t.transactionHash,
                                    unconfirmed: t.unconfirmed,
                                    hex: transaction.hex
                                });
                            }
                        }
                    }

                    // .reduce on empty array will throw error in the service worker.
                    let balanceConfirmed = 0;
                    const filteredConfirmed = utxos.filter(t => !t.unconfirmed);
                    if (filteredConfirmed.length > 0) {
                        balanceConfirmed = filteredConfirmed.reduce((a, b) => a + b.balance, 0);
                    }

                    let balanceUnconfirmed = 0;
                    const filteredUnconfirmed = utxos.filter(t => t.unconfirmed);
                    if (filteredUnconfirmed.length > 0) {
                        balanceUnconfirmed = filteredUnconfirmed.reduce((a, b) => a + b.balance, 0);
                    }

                    this.accountHistoryStore.set(account.identifier, {
                        history: accountHistory,
                        unspent: utxos,
                        balance: balanceConfirmed,
                        unconfirmed: balanceUnconfirmed
                    });

                    await this.accountHistoryStore.save();
                    await this.accountStateStore.save();
                }
            }
        }
    }

    /** This is the main process that runs the indexing and persists the state. */
    async process(addressWatchStore: AddressWatchStore): Promise<ProcessResult> {
        // TODO: There is a lot of duplicate code in this method, refactor when possible.
        let changes = false;
        const settings = this.settingStore.get();
        const wallets = this.walletStore.getWallets();
        let anyAddressNotCompleteInAnyWallet = false;

        // Check if there is any accounts at all.
        const allAccounts = wallets.flatMap(w => w.accounts);

        if (allAccounts.length == 0) {
            console.log('There are zero accounts in wallets.');
            return { changes: false, completed: true };
        }

        console.log('Looping wallets', wallets);

        for (let i = 0; i < wallets.length; i++) {
            if (this.runState.cancel) {
                return { cancelled: true };
            }

            const wallet = wallets[i];

            console.log('Looping accounts:', wallet.accounts);

            if (wallet.accounts.length == 0) {
                return { changes: false, completed: true };
            }

            for (let j = 0; j < wallet.accounts.length; j++) {
                if (this.runState.cancel) {
                    return { cancelled: true };
                }

                const date = new Date().toISOString();
                const account = wallet.accounts[j];
                const accountState = this.accountStateStore.get(account.identifier);
                const network = this.addressManager.getNetwork(account.networkType);
                const indexerUrl = this.addressManager.networkLoader.getServer(network.id, settings.server, settings.indexer);

                accountState.lastScan = date;
                let anyAddressNotComplete = false;

                // If the account type is quick, we'll rely fully on indexer APIs and not perform local historical processing.
                if (account.mode === 'quick') {
                    // We'll only run when indexing is running, not on watch. If we run it on watch, we'll keep getting the full balance
                    // every 15 seconds (or what the configuration is).
                    if (addressWatchStore) {
                        // If there is a watch interval and there is anything in the watch store, the user might have just
                        // recently been sending a transaction. So we'll perform an reindex and clear the watch list.
                        const addresses = addressWatchStore.byAccountId(account.identifier);

                        if (addresses.length == 0) {
                            continue;
                        }
                    }

                    // Process receive addresses until we've exhausted them.
                    for (let k = 0; k < accountState.receive.length; k++) {
                        if (this.runState.cancel) {
                            return { cancelled: true };
                        }

                        const address = accountState.receive[k];

                        // Get the current state for this address:
                        let addressState = this.addressIndexedStore.get(address.address);

                        if (!addressState) {
                            addressState = { address: address.address, offset: 0 };
                        } else {
                            // Every time we reindex in quick mode, we must reset the balance.
                            addressState.balance = 0;
                        }

                        const processState = await this.processAddressIndexed(indexerUrl, addressState);

                        if (!processState.completed) {
                            anyAddressNotComplete = true;
                        }

                        if (processState.changes) {
                            changes = true;

                            // Set the address state again after we've updated it.
                            this.addressIndexedStore.set(address.address, addressState);

                            // After processing, make sure we save the address state.
                            await this.addressIndexedStore.save();
                        }

                        // If we are on the last address, check if we should add new one.
                        if ((k + 1) >= accountState.receive.length) {
                            // If there are transactions on the last checked address, add the next address.
                            if (addressState.totalReceivedCount > 0) {
                                const nextAddress = this.addressManager.getAddress(account, 0, address.index + 1);
                                accountState.receive.push(nextAddress);
                                changes = true;
                            }
                        }
                    }

                    for (let k = 0; k < accountState.change.length; k++) {
                        if (this.runState.cancel) {
                            return { cancelled: true };
                        }

                        const address = accountState.change[k];
                        // Get the current state for this address:
                        let addressState = this.addressIndexedStore.get(address.address);

                        if (!addressState) {
                            addressState = { address: address.address, offset: 0 };
                        }

                        const processState = await this.processAddressIndexed(indexerUrl, addressState);

                        if (!processState.completed) {
                            anyAddressNotComplete = true;
                        }

                        if (processState.changes) {
                            changes = true;

                            // Set the address state again after we've updated it.
                            this.addressIndexedStore.set(address.address, addressState);

                            // After processing, make sure we save the address state.
                            await this.addressIndexedStore.save();
                        }

                        // If we are on the last address, check if we should add new one.
                        if ((k + 1) >= accountState.change.length) {
                            // If there are transactions on the last checked address, add the next address.
                            if (addressState.totalReceivedCount > 0) {
                                const nextAddress = this.addressManager.getAddress(account, 1, address.index + 1);
                                accountState.change.push(nextAddress);
                                changes = true;
                            }
                        }
                    }
                } else {
                    if (addressWatchStore) {
                        // If the account is not fully synced, we should not perform watch over the account yet.
                        if (!accountState.completedScan) {
                            changes = false;
                            continue;
                        }

                        const addresses = addressWatchStore.byAccountId(account.identifier);

                        // Process registered addresses until we've exhausted them.
                        for (let k = 0; k < addresses.length; k++) {
                            if (this.runState.cancel) {
                                return { cancelled: true };
                            }

                            const address = addresses[k];
                            address.count = address.count + 1;

                            // Update the watch store with the count attempts.
                            addressWatchStore.set(address.address, address);

                            // Get the current state for this address:
                            let addressState = this.addressStore.get(address.address); // TODO: Investigate if we potentially have issues with 
                            // blockchains that use same prefix. They should result in different public keys, and hence different addresses, 
                            // even though they are derived from same master and share the same prefix.

                            // If there are no addressState for this, create one now.
                            if (!addressState) {
                                addressState = { address: address.address, offset: 0, transactions: [] };
                            }

                            const processState = await this.processAddress(indexerUrl, addressState);

                            if (!processState.completed) {
                                anyAddressNotComplete = true;
                            }

                            if (processState.changes) {
                                changes = true;

                                // Set the address state again after we've updated it.
                                this.addressStore.set(address.address, addressState);

                                // After processing, make sure we save the address state.
                                await this.addressStore.save();
                            }

                            // If we have watched this address for max amount, remove it.
                            if (address.count >= this.maxWatch) {
                                console.log('Stopping to watch (max watch reached):', address);
                                addressWatchStore.remove(address.address);
                            } else if (address.count >= this.minWatchCount) {
                                console.log('minWatchCount reached, validate against latest tx now:', this.minWatchCount);

                                // Get the latest transaction on the address and check if we should continue to watch it.
                                if (addressState.transactions.length > 0) {
                                    const latestTransaction = addressState.transactions[addressState.transactions.length - 1];
                                    const transaction = this.transactionStore.get(latestTransaction);
                                    const continueWatching = (transaction.confirmations <= this.watch);
                                    console.log('transaction.confirmations in watching:', transaction.confirmations);

                                    // If we have observed the latest transaction to have more confirmations than the watch
                                    // height, we will remove it from the watch list.
                                    if (!continueWatching) {
                                        // Do not watch any longer ...
                                        console.log('Stopping to watch:', address);
                                        addressWatchStore.remove(address.address);
                                    }
                                }
                            }
                        }

                        if (network.singleAddress === true) {
                            // Get the first receive addresses.
                            const address = accountState.receive[0];
                            console.log('Running Watch on primary receive address', address);

                            // Get the current state for this address:
                            let addressState = this.addressStore.get(address.address);

                            // If there are no addressState for this, create one now.
                            if (!addressState) {
                                addressState = { address: address.address, offset: 0, transactions: [] };
                            }

                            const processState = await this.processAddress(indexerUrl, addressState);

                            if (!processState.completed) {
                                anyAddressNotComplete = true;
                            }

                            if (processState.changes) {
                                changes = true;

                                // Set the address state again after we've updated it.
                                this.addressStore.set(address.address, addressState);

                                // After processing, make sure we save the address state.
                                await this.addressStore.save();
                            }
                        }

                        // Get the last receive addresses.
                        const address = accountState.receive[accountState.receive.length - 1];

                        console.log('Running Watch on receive address', address);

                        // Get the current state for this address:
                        let addressState = this.addressStore.get(address.address);

                        // If there are no addressState for this, create one now.
                        if (!addressState) {
                            addressState = { address: address.address, offset: 0, transactions: [] };
                        }

                        const processState = await this.processAddress(indexerUrl, addressState);

                        if (!processState.completed) {
                            anyAddressNotComplete = true;
                        }

                        if (processState.changes) {
                            changes = true;

                            // Set the address state again after we've updated it.
                            this.addressStore.set(address.address, addressState);

                            // After processing, make sure we save the address state.
                            await this.addressStore.save();

                            // When there is changes on the latest receive address, we'll make sure to add this address to our 
                            // watch list. We will also add a new address to the account, which will be picked up on
                            // next watch interval.
                            addressWatchStore.set(address.address, {
                                address: address.address,
                                accountId: account.identifier,
                                count: 0
                            });

                            // If there are transactions on the last checked address, add the next address.
                            if (addressState.transactions.length > 0) {
                                const nextAddress = this.addressManager.getAddress(account, 0, address.index + 1);
                                accountState.receive.push(nextAddress);
                                changes = true;
                            }
                        }

                        // On newly created accounts, there might not be any change address.
                        if (accountState.change.length === 0) {
                            const nextAddress = this.addressManager.getAddress(account, 1, 0);
                            accountState.change.push(nextAddress);
                            changes = true;
                        }

                        // Get the last change addresses.
                        const addressChange = accountState.change[accountState.change.length - 1];

                        console.log('Running Watch on change address', addressChange);

                        // Get the current state for this address:
                        let addressStateChange = this.addressStore.get(addressChange.address);

                        // If there are no addressState for this, create one now.
                        if (!addressStateChange) {
                            addressStateChange = { address: addressChange.address, offset: 0, transactions: [] };
                        }

                        const processAddressState = await this.processAddress(indexerUrl, addressStateChange);

                        if (!processAddressState.completed) {
                            anyAddressNotComplete = true;
                        }

                        if (processAddressState.changes) {
                            changes = true;

                            // Set the address state again after we've updated it.
                            this.addressStore.set(addressChange.address, addressStateChange);

                            // After processing, make sure we save the address state.
                            await this.addressStore.save();

                            // When there is changes on the latest receive address, we'll make sure to add this address to our 
                            // watch list. We will also add a new address to the account, which will be picked up on
                            // next watch interval.
                            addressWatchStore.set(addressChange.address, {
                                address: addressChange.address,
                                accountId: account.identifier,
                                count: 0
                            });

                            // If there are transactions on the last checked address, add the next address.
                            if (addressStateChange.transactions.length > 0) {
                                const nextAddress = this.addressManager.getAddress(account, 1, addressChange.index + 1);
                                accountState.change.push(nextAddress);
                                changes = true;
                            }
                        }

                        // Persist the watch store.
                        await addressWatchStore.save();
                    }
                    else {
                        // Process receive addresses until we've exhausted them.
                        for (let k = 0; k < accountState.receive.length; k++) {
                            if (this.runState.cancel) {
                                return { cancelled: true };
                            }

                            const address = accountState.receive[k];

                            // Get the current state for this address:
                            let addressState = this.addressStore.get(address.address);

                            // If there are no addressState for this, create one now.
                            if (!addressState) {
                                addressState = { address: address.address, offset: 0, transactions: [] };
                            }

                            const processState = await this.processAddress(indexerUrl, addressState);

                            console.log('Completed processing:', processState);

                            if (!processState.completed) {
                                anyAddressNotComplete = true;
                            }

                            if (processState.changes) {
                                changes = true;

                                // Set the address state again after we've updated it.
                                this.addressStore.set(address.address, addressState);

                                // After processing, make sure we save the address state.
                                await this.addressStore.save();
                            }

                            // If we are on the last address, check if we should add new one.
                            if ((k + 1) >= accountState.receive.length) {
                                // If there are transactions on the last checked address, add the next address.
                                if (addressState.transactions.length > 0) {
                                    const nextAddress = this.addressManager.getAddress(account, 0, address.index + 1);
                                    accountState.receive.push(nextAddress);
                                    changes = true;
                                }
                            }
                        }

                        for (let k = 0; k < accountState.change.length; k++) {
                            if (this.runState.cancel) {
                                return { cancelled: true };
                            }

                            const address = accountState.change[k];
                            // Get the current state for this address:
                            let addressState = this.addressStore.get(address.address);

                            // If there are no addressState for this, create one now.
                            if (!addressState) {
                                addressState = { address: address.address, offset: 0, transactions: [] };
                            }

                            const processState = await this.processAddress(indexerUrl, addressState);

                            if (!processState.completed) {
                                anyAddressNotComplete = true;
                            }

                            if (processState.changes) {
                                changes = true;

                                // Set the address state again after we've updated it.
                                this.addressStore.set(address.address, addressState);

                                // After processing, make sure we save the address state.
                                await this.addressStore.save();
                            }

                            // If we are on the last address, check if we should add new one.
                            if ((k + 1) >= accountState.change.length) {
                                // If there are transactions on the last checked address, add the next address.
                                if (addressState.transactions.length > 0) {
                                    const nextAddress = this.addressManager.getAddress(account, 1, address.index + 1);
                                    accountState.change.push(nextAddress);
                                    changes = true;
                                }
                            }
                        }
                    }
                }

                // When completely processes all the address, we'll save the transactions.
                await this.transactionStore.save();

                // If any addresses on this account is not fully indexed, make sure we mark it.
                accountState.completedScan = !anyAddressNotComplete;

                if (!anyAddressNotComplete) {
                    anyAddressNotCompleteInAnyWallet = true;
                }
            }

            // When all accounts has been processes, saved the wallet.
            await this.walletStore.save();
            await this.accountStateStore.save();

            console.log('AccountStateStore:', this.accountStateStore.all());
        }

        console.log('Indexer finished:', changes);

        return { changes, completed: anyAddressNotCompleteInAnyWallet, cancelled: false };
    }

    parseLinkHeader(linkHeader: string) {
        const sections = linkHeader.split(', ');
        const links = { first: null as string, last: null as string, previous: null as string, next: null as string } as any;

        sections.forEach(section => {
            const key = section.substring(section.indexOf('rel="') + 5).replace('"', '');
            const value = section.substring(section.indexOf('<') + 1, section.indexOf('>'));
            links[key] = value;
        });

        return links;
    }

    async getTransactionInfo(transactionId: string, indexerUrl: string) {
        const url = `${indexerUrl}/api/query/transaction/${transactionId}`;
        const response = await this.fetchUrl(url);
        return response.json();
    }

    async fetchUrl(url: string) {
        // Default options are marked with *
        return await fetch(url, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        });
    }

    async getTransactionHex(transactionId: string, indexerUrl: string) {
        const url = `${indexerUrl}/api/query/transaction/${transactionId}/hex`;
        const response = await this.fetchUrl(url);
        return response.text();
    }

    async processAddress(indexerUrl: string, state: AddressState) {
        let changes = false;
        let completed = false;

        let countProcessedItems = 0;

        try {
            let nextLink = `/api/query/address/${state.address}/transactions?offset=${state.offset}&limit=${this.limit}`;
            const date = new Date().toISOString();
            const clonedIndexerUrl = indexerUrl.slice(); // clone the URL

            // Loop through all pages until finished.
            while (nextLink != null) {

                const url = `${clonedIndexerUrl}${nextLink}`;
                console.log(`nextlink: ${url}`);

                // Default options are marked with *
                const response = await fetch(url, {
                    method: 'GET', // *GET, POST, PUT, DELETE, etc.
                    mode: 'cors', // no-cors, *cors, same-origin
                    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                    credentials: 'same-origin', // include, *same-origin, omit
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    redirect: 'follow', // manual, *follow, error
                    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                });

                const transactions = await response.json();
                // const responseTransactions = await axios.get(`${indexerUrl}${nextLink}`);
                // const transactions = responseTransactions.data;
                const links = this.parseLinkHeader(response.headers.get('link'));

                // const limit = response.headers.get('pagination-limit');
                // const total = response.headers.get('pagination-total');
                const offset = Number(response.headers.get('pagination-offset'));

                // Store the latest offset on the state.
                state.offset = offset;

                // Increase the count process items, used to buffer large addresses.
                countProcessedItems += this.limit;

                if (response.ok) {
                    // Since we are paging, and all items in pages should be sorted correctly, we can simply
                    // replace the item at the right index for each page. This should update with new metadata,
                    // if there is anything new.
                    for (let j = 0; j < transactions.length; j++) {
                        changes = true;

                        const transaction: Transaction = transactions[j];
                        const transactionId = transaction.transactionHash;
                        const index = state.transactions.indexOf(transactionId);

                        // Keep updating with transaction info details until finalized (and it will no longer be returned in the paged query):
                        transaction.details = await this.getTransactionInfo(transactionId, clonedIndexerUrl);

                        // Copy some of the details state to the container object.
                        transaction.confirmations = transaction.details.confirmations;

                        // If the transaction ID is not present already on the AddressState, add it.
                        if (index == -1) {
                            state.transactions.push(transactionId);
                        }

                        transaction.unconfirmed = (transaction.confirmations < this.confirmed);
                        transaction.finalized = (transaction.confirmations >= this.finalized);

                        // Whenever we reseach finalized transactions, move the offset state forward.
                        if (transaction.finalized) {
                            state.offset = offset + (j + 1);
                        }

                        // TODO: Temporarily drop this while testing a large wallet.
                        // TODO: We have now implemented on-demand retreival of hex when sending, investigate if that is better and more proper as
                        // there is no value in getting spent data.
                        // if (!transaction.hex) {
                        //     transaction.hex = await this.getTransactionHex(transactionId, indexerUrl);
                        // }

                        // Update the store with latest info on the transaction.
                        this.transactionStore.set(transactionId, transaction);

                        // Persist immediately because the watcher need to have
                        await this.transactionStore.save();
                    }
                }

                // When we have processed more items than batch size, and there is actually a next page, we'll stop processing and continue later.
                if (links.next != null && countProcessedItems > this.batchSize) {
                    completed = false;
                    nextLink = null;
                }
                else {
                    // Just set the completed to true every time here, to override false done when batch size is hit.
                    completed = true;
                    nextLink = links.next;
                }
            }

        } catch (error) {
            console.log('Failed to query indexer!!');
            console.error(error);
            // this.status.update({ networkType: account.networkType, status: 'Error', availability: IndexerApiStatus.Error });
            // this.logger.error(error);

            // TODO: Implement error handling in background and how to send it to UI.
            // We should probably have an error log in settings, so users can see background problems as well.

            // TODO: FIX THIS!!
            // this.communication.sendToAll('error', error);
        }

        return { changes, completed };
    }

    async processAddressIndexed(indexerUrl: string, state: AddressIndexedState) {
        let changes = false;
        let completed = false;
        let countProcessedItems = 0;

        try {
            const clonedIndexerUrl = indexerUrl.slice(); // clone the URL
            const url = `${clonedIndexerUrl}/api/query/address/${state.address}`;
            console.log(`address url ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
            });

            const addressData = await response.json();

            // Merge the new data into the existing data.
            state = Object.assign(state, addressData);

            return { changes: true, completed: true };

        } catch (error) {
            console.log('Failed to query indexer!!');
            console.error(error);
            // this.status.update({ networkType: account.networkType, status: 'Error', availability: IndexerApiStatus.Error });
            // this.logger.error(error);

            // TODO: Implement error handling in background and how to send it to UI.
            // We should probably have an error log in settings, so users can see background problems as well.

            // TODO: FIX THIS!!
            // this.communication.sendToAll('error', error);
        }

        return { changes, completed };
    }
}