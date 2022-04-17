import axiosRetry from 'axios-retry';
import { networkInterfaces } from 'os';
import { AddressState, Transaction } from '.';
import { AddressManager } from './address-manager';
import { AccountUnspentTransactionOutput, TransactionHistory } from './interfaces';
import { AccountHistoryStore, AddressStore, SettingStore, TransactionStore, WalletStore } from './store';
import { AddressWatchStore } from './store/address-watch-store';

//const axios = require('axios');
// In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with require() use the following approach:
const axios = require('axios').default;
axiosRetry(axios, { retries: 3 });

/** Service that handles queries against the blockchain indexer to retrieve data for accounts. Runs in the background. */
export class IndexerBackgroundService {
    private limit = 20;
    private finalized = 500;
    private confirmed = 1;

    /** The height at which we will stop watching. */
    private watch = 3;

    /** The maximum number of times we'll attempt to watch an address before it's wiped from the watch list. */
    private maxWatch = 500;

    /** We will attempt to query the address at minimum 10 times before we check the latest transactions if we should quit. */
    private minWatchCount = 10;

    /** The number of entries pr. address to process before updating the UI with partially indexed data. This won't affect
     * large wallets that have a single transaction pr. address and many addresses, but it will make large staker/miner wallets
     * work much better.
     */
    private batchSize = 50;

    constructor(
        private settingStore: SettingStore,
        private walletStore: WalletStore,
        private addressStore: AddressStore,
        private transactionStore: TransactionStore,
        private addressManager: AddressManager,
        private accountHistoryStore: AccountHistoryStore
    ) {

    }

    async calculateBalance() {
        // Then calculate the balance.
        const wallets = this.walletStore.all();
        const addressStates = this.addressStore.all();
        const transactions = this.transactionStore.all();

        // console.log(walletStore);
        // console.log(addressStore);
        // console.log(transactionStore);

        for (let i = 0; i < wallets.length; i++) {
            const wallet = wallets[i];

            // Then calculate the balance.
            const accounts = wallet.accounts;

            for (let j = 0; j < accounts.length; j++) {
                const account = accounts[j];

                const receive = account.state.receive; // .flatMap(i => i.unspent).filter(i => i !== undefined);
                const change = account.state.change; // .flatMap(i => i.unspent).filter(i => i !== undefined);
                const addressesList = [...receive, ...change];
                const addresses = addressesList.flatMap(a => a.address);

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

                    // console.log('externalOutputs', externalOutputs);
                    // console.log('internalOutputs', internalOutputs);
                    // console.log('externalInputs', externalInputs);
                    // console.log('internalInputs', internalInputs);

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
                                // console.log('OUTPUTS', outputs);
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

                        // console.log(tx);
                        // console.log(t);
                        // console.log('tx.hasContract', tx.hasContract);
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

                // console.log('accountHistory:');
                // console.log(JSON.stringify(accountHistory));

                // The UI during "unconfirmed" period will not sort properly, attempt to fix the issue by doing an 
                // extra sort here before persisting. Also attempt to re-assign it.
                // accountHistory = accountHistory.sort((a: any, b: any) => {
                //     let index1 = a.blockIndex;
                //     let index2 = b.blockIndex;

                //     if (index1 == 0) index1 = 9007199254740991;
                //     if (index2 == 0) index2 = 9007199254740991;

                //     if (index1 < index2) return 1;
                //     if (index1 > index2) return -1;
                //     return 0;
                // });

                // console.log('accountHistory2:');
                // console.log(JSON.stringify(accountHistory));

                this.accountHistoryStore.set(account.identifier, {
                    history: accountHistory,
                    unspent: utxos,
                    balance: balanceConfirmed,
                    unconfirmed: balanceUnconfirmed
                });

                await this.accountHistoryStore.save();

                console.log('accountHistoryStore.save!!!!!!!');
                console.log(this.accountHistoryStore.all());
            }
        }
    }

    /** This is the main process that runs the indexing and persists the state. */
    async process(addressWatchStore: AddressWatchStore) {
        console.log('INDEXER:PROCESS ENTRY WAS TRIGGERED...');

        // TODO: There is a lot of duplicate code in this method, refactor when possible.
        let changes = false;
        const settings = this.settingStore.get();
        const wallets = this.walletStore.getWallets();
        let anyAddressNotCompleteInAnyWallet = false;

        for (let i = 0; i < wallets.length; i++) {
            const wallet = wallets[i];

            for (let j = 0; j < wallet.accounts.length; j++) {
                const date = new Date().toISOString();
                const account = wallet.accounts[j];
                account.lastScan = date;

                const network = this.addressManager.getNetwork(account.networkType);
                const indexerUrl = settings.indexer.replace('{id}', network.id.toLowerCase());
                const primaryReceiveAddress = account.state.receive[0];

                let anyAddressNotComplete = false;

                console.log('Indexer:Process...', account);

                if (addressWatchStore) {
                    // If the account is not fully synced, we should not perform watch over the account yet.
                    if (!account.completedScan) {
                        changes = false;
                        continue;
                    }

                    const addresses = addressWatchStore.all();
                    console.log('Running Watcher', addresses);

                    // Process registered addresses until we've exhausted them.
                    for (let k = 0; k < addresses.length; k++) {
                        const address = addresses[k];
                        address.count = address.count + 1;

                        // Update the watch store with the count attempts.
                        addressWatchStore.set(address.address, address);

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

                        // If we have watched this address for max amount, remove it.
                        if (address.count >= this.maxWatch) {
                            console.log('Stopping to watch (max watch reached):', address);

                            // if (network.singleAddress === true && address.address === primaryReceiveAddress.address) {
                            //     console.log(`Single address enabled and continue to watch primary address: ${primaryReceiveAddress.address}`);
                            // }
                            // else {
                            addressWatchStore.remove(address.address);
                            // }

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

                                    // if (network.singleAddress === true && address.address === primaryReceiveAddress.address) {
                                    //     console.log(`Single address enabled and continue to watch primary address: ${primaryReceiveAddress.address}`);
                                    // }
                                    // else {
                                    addressWatchStore.remove(address.address);
                                    // }
                                }
                            }
                        }
                    }

                    if (network.singleAddress === true) {
                        // Get the first receive addresses.
                        const address = account.state.receive[0];
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
                    const address = account.state.receive[account.state.receive.length - 1];
                    // const alreadyWatched = (addressWatchStore.get(address.address) != null);

                    // if (alreadyWatched) {
                    // }

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
                            account.state.receive.push(nextAddress);
                            changes = true;
                        }
                    }

                    // On newly created accounts, there might not be any change address.
                    if (account.state.change.length === 0) {
                        const nextAddress = this.addressManager.getAddress(account, 1, 0);
                        account.state.change.push(nextAddress);
                        changes = true;
                    }

                    // Get the last change addresses.
                    const addressChange = account.state.change[account.state.change.length - 1];

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
                            account.state.change.push(nextAddress);
                            changes = true;
                        }
                    }

                    // Persist the watch store.
                    await addressWatchStore.save();
                }
                else {
                    // Process receive addresses until we've exhausted them.
                    for (let k = 0; k < account.state.receive.length; k++) {
                        const address = account.state.receive[k];

                        console.log('RECEIVE ADDRESS LOOP' + k, address);

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

                            const address1 = await this.addressStore.get(address.address);
                            await this.addressStore.load();
                            const address2 = await this.addressStore.get(address.address);

                            console.log('Address State saved', addressState);
                            console.log('Address State saved 1', address1);
                            console.log('Address State saved 2', address2);
                        }

                        // If we are on the last address, check if we should add new one.
                        if ((k + 1) >= account.state.receive.length) {
                            // If there are transactions on the last checked address, add the next address.
                            if (addressState.transactions.length > 0) {
                                const nextAddress = this.addressManager.getAddress(account, 0, address.index + 1);
                                account.state.receive.push(nextAddress);
                                changes = true;
                            }
                        }
                    }

                    for (let k = 0; k < account.state.change.length; k++) {
                        const address = account.state.change[k];
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
                        if ((k + 1) >= account.state.change.length) {
                            // If there are transactions on the last checked address, add the next address.
                            if (addressState.transactions.length > 0) {
                                const nextAddress = this.addressManager.getAddress(account, 1, address.index + 1);
                                account.state.change.push(nextAddress);
                                changes = true;
                            }
                        }
                    }
                }

                // When completely processes all the address, we'll save the transactions.
                await this.transactionStore.save();

                // If any addresses on this account is not fully indexed, make sure we mark it.
                account.completedScan = !anyAddressNotComplete;

                if (!anyAddressNotComplete) {
                    anyAddressNotCompleteInAnyWallet = true;
                }
            }

            // When all accounts has been processes, saved the wallet.
            await this.walletStore.save();
        }

        console.log('RETURNING FROM INDEXER: ', changes);

        return { changes, completed: anyAddressNotCompleteInAnyWallet };
    }

    parseLinkHeader(linkHeader: string) {
        const sections = linkHeader.split(', ');
        //const links: Record<string, string> = { };
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

            // Loop through all pages until finished.
            while (nextLink != null) {

                const url = `${indexerUrl}${nextLink}`;

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

                console.log('FETCHING: ', url);

                const transactions = await response.json();
                // const responseTransactions = await axios.get(`${indexerUrl}${nextLink}`);
                // const transactions = responseTransactions.data;
                const links = this.parseLinkHeader(response.headers.get('link'));

                console.log('LINKS', links);

                // const limit = response.headers.get('pagination-limit');
                // const total = response.headers.get('pagination-total');
                const offset = Number(response.headers.get('pagination-offset'));

                // Store the latest offset on the state.
                state.offset = offset;

                // Increase the count process items, used to buffer large addresses.
                countProcessedItems += this.limit;

                if (response.ok) {
                    // var updatedReceiveAddress: Address = { ...receiveAddress };
                    // console.log(responseTransactions);

                    // Since we are paging, and all items in pages should be sorted correctly, we can simply
                    // replace the item at the right index for each page. This should update with new metadata,
                    // if there is anything new.
                    for (let j = 0; j < transactions.length; j++) {
                        changes = true;

                        const transaction: Transaction = transactions[j];
                        const transactionId = transaction.transactionHash;
                        const index = state.transactions.indexOf(transactionId);

                        // Keep updating with transaction info details until finalized (and it will no longer be returned in the paged query):
                        transaction.details = await this.getTransactionInfo(transactionId, indexerUrl);

                        console.log('Retreived transaction details', transaction);

                        // Copy some of the details state to the container object.
                        transaction.confirmations = transaction.details.confirmations;
                        // transaction.blockIndex = transaction.details.blockIndex;
                        // transaction.unconfirmed = (transaction.details.confirmations == 0);

                        // If the transaction ID is not present already on the AddressState, add it.
                        if (index == -1) {
                            state.transactions.push(transactionId);
                        }

                        const unconfirmed = transaction.unconfirmed;

                        transaction.unconfirmed = (transaction.confirmations <= this.confirmed);
                        transaction.finalized = (transaction.confirmations >= this.finalized);

                        console.log(`UNCONFIRMED: BEFORE: ${unconfirmed} - AFTER: ${transaction.unconfirmed}.`);

                        // Whenever we reseach finalized transactions, move the offset state forward.
                        if (transaction.finalized) {
                            state.offset = offset + (j + 1);
                        }

                        // const transactionInfo = this.transactionStore.get(transactionId);

                        // TODO: Temporarily drop this while testing a large wallet.
                        // if (!transaction.hex) {
                        //     transaction.hex = await this.getTransactionHex(transactionId, indexerUrl);
                        // }

                        // console.log('Transaction to be put in store:', transaction);

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

    // async watchIndexer() {
    //     this.logger.info('watchIndexer executing.', this.a);

    //     this.a.forEach(async (value, key) => {
    //         const account = value.account;
    //         const addressEntry = value.addressEntry;
    //         const network = this.status.getNetwork(account.networkType);
    //         const indexerUrl = this.settings.values.indexer.replace('{id}', network.id.toLowerCase());
    //         const networkStatus = this.status.get(account.networkType);

    //         // If the current network status is anything other than online, skip indexing.
    //         if (networkStatus && networkStatus.availability != IndexerApiStatus.Online) {
    //             this.logger.warn(`Network ${account.networkType} is not online. Skipping query for indexer state.`);

    //         } else {
    //             try {
    //                 // We don't have Angular context available in the background, we we'll rely on axios to perform queries:
    //                 const date = new Date().toISOString();
    //                 const response = await axios.get(`${indexerUrl}/api/query/address/${addressEntry.address}`);
    //                 const data = response.data;

    //                 // If there is any difference in the balance, make sure we update!
    //                 if (addressEntry.balance != data.balance) {
    //                     this.logger.info('BALANCE IS DIFFERENT, UPDATE STATE!', addressEntry.balance, data.balance, data);
    //                     await this.updateAddressState(indexerUrl, value.addressEntry, value.change, data, account);

    //                     // Stop watching this address.
    //                     this.a.delete(key);
    //                 } else if (data.pendingSent > 0 || data.pendingReceived > 0) {
    //                     this.logger.info('PENDING, UPDATE STATE!');

    //                     // If there is any pending, we'll continue watching this address.
    //                     await this.updateAddressState(indexerUrl, value.addressEntry, value.change, data, account);
    //                     // Continue watching this address as long as there is pending, when pending becomes 0, the balance should hopefully
    //                     // be updated and one final update will be performed before removing this watch entry.
    //                 } else {
    //                     // -1 means we will process forever until this address has been used and spent.
    //                     if (value.count === -1) {
    //                         this.logger.debug('Will continue to process until change discovered: ', value);
    //                     } else {
    //                         // If there are no difference in balance and no pending and we've queried already 10 times (10 * 10 seconds), we'll
    //                         // stop watching this address.
    //                         value.count = value.count + 1;

    //                         this.logger.debug('Will continue to process for a little longer: ', value.count);

    //                         if (value.count > 10) {
    //                             // When finished, remove from the list.
    //                             this.logger.debug('Watching was finished, removing: ', key);
    //                             this.a.delete(key);
    //                         }
    //                     }
    //                 }
    //             } catch (error) {
    //                 this.status.update({ networkType: account.networkType, status: 'Error', availability: IndexerApiStatus.Error });
    //                 account.networkStatus = 'Error';

    //                 this.logger.error(error);
    //                 // TODO: Implement error handling in background and how to send it to UI.
    //                 // We should probably have an error log in settings, so users can see background problems as well.
    //                 // TODO: FIX!!
    //                 //this.manager.communication.sendToAll('error', error);
    //             }
    //         }
    //     });
    // }
}