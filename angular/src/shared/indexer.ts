import axiosRetry from 'axios-retry';
import { Account, AddressState, Transaction } from '.';
import { AddressManager } from './address-manager';
import { AddressStore, SettingStore, TransactionStore, WalletStore } from './store';

//const axios = require('axios');
// In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with require() use the following approach:
const axios = require('axios').default;
axiosRetry(axios, { retries: 3 });

// class Queue {
//     items: any[];

//     constructor(...params: any[]) {
//         this.items = [...params];
//     }

//     enqueue(item: any) {
//         this.items.push(item);
//     }

//     dequeue() {
//         return this.items.shift();
//     }

//     getItems() {
//         return this.items
//     }

//     isEmpty() {
//         return this.items.length == 0;
//     }

//     peek() {
//         return !this.isEmpty() ? this.items[0] : undefined;
//     }

//     length() {
//         return this.items.length;
//     }
// }

/** Service that handles queries against the blockchain indexer to retrieve data for accounts. Runs in the background. */
export class IndexerBackgroundService {
    private limit = 10;
    private finalized = 500;
    private confirmed = 1;

    constructor(
        private settingStore: SettingStore,
        private walletStore: WalletStore,
        private addressStore: AddressStore,
        private transactionStore: TransactionStore,
        private addressManager: AddressManager,
    ) {

    }

    /** This is the main process that runs the indexing and persists the state. */
    async process() {
        let changes = false;
        const settings = this.settingStore.get();
        const wallets = this.walletStore.getWallets();

        for (let i = 0; i < wallets.length; i++) {
            const wallet = wallets[i];

            for (let j = 0; j < wallet.accounts.length; j++) {
                const account = wallet.accounts[j];

                const network = this.addressManager.getNetwork(account.networkType);
                const indexerUrl = settings.indexer.replace('{id}', network.id.toLowerCase());

                // Process first receive addresses until we've exhausted them.
                for (let k = 0; k < account.state.receive.length; k++) {
                    const address = account.state.receive[k];
                    // Get the current state for this address:
                    let addressState = this.addressStore.get(address.address);

                    // If there are no addressState for this, create one now.
                    if (!addressState) {
                        addressState = { address: address.address, offset: 0, transactions: [] };
                        changes = true;
                        // this.addressStore.set(address.address, addressState);
                    }

                    const hadChanges = await this.processAddress(indexerUrl, addressState);

                    if (hadChanges) {
                        changes = true;

                        // Set the address state again after we've updated it.
                        this.addressStore.set(address.address, addressState);

                        // After processing, make sure we save the address state.
                        await this.addressStore.save();
                    }

                    // If we are on the last address, check if we should add new one.
                    if ((k + 1) >= account.state.receive.length) {
                        // If there are addresses on the last checked address, add the next address.
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
                        changes = true;
                        // this.addressStore.set(address.address, addressState);
                    }

                    const hadChanges = await this.processAddress(indexerUrl, addressState);

                    if (hadChanges) {
                        changes = true;

                        // Set the address state again after we've updated it.
                        this.addressStore.set(address.address, addressState);

                        // After processing, make sure we save the address state.
                        await this.addressStore.save();
                    }

                    // If we are on the last address, check if we should add new one.
                    if ((k + 1) >= account.state.change.length) {
                        // If there are addresses on the last checked address, add the next address.
                        if (addressState.transactions.length > 0) {
                            const nextAddress = this.addressManager.getAddress(account, 1, address.index + 1);
                            account.state.change.push(nextAddress);
                            changes = true;
                        }
                    }
                }

                // When completely processes all the address, we'll save the transactions.
                await this.transactionStore.save();
            }

            // When all accounts has been processes, saved the wallet.
            await this.walletStore.save();
        }

        return changes;
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

                const transactions = await response.json();
                // const responseTransactions = await axios.get(`${indexerUrl}${nextLink}`);
                // const transactions = responseTransactions.data;
                const links = this.parseLinkHeader(response.headers.get('link'));

                // const limit = response.headers.get('pagination-limit');
                // const total = response.headers.get('pagination-total');
                const offset = Number(response.headers.get('pagination-offset'));

                // Store the latest offset on the state.
                state.offset = offset;

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

                        // If the transaction ID is not present already on the AddressState, add it.
                        if (index == -1) {
                            state.transactions.push(transactionId);
                        }

                        transaction.unconfirmed = (transaction.confirmations <= this.confirmed);
                        transaction.finalized = (transaction.confirmations >= this.finalized);

                        // Whenever we reseach finalized transactions, move the offset state forward.
                        if (transaction.finalized) {
                            state.offset = offset + (j + 1);
                        }

                        const transactionInfo = this.transactionStore.get(transactionId);

                        // If the transaction is not stored yet, query additional data then save it to the store.
                        if (!transactionInfo) {
                            transaction.hex = await this.getTransactionHex(transactionId, indexerUrl);
                        }

                        // Keep updating with transaction info details until finalized (and it will no longer be returned in the paged query):
                        transaction.details = await this.getTransactionInfo(transactionId, indexerUrl);

                        // Update the store with latest info on the transaction.
                        this.transactionStore.set(transactionId, transaction);
                    }
                }

                nextLink = links.next;
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

        return changes;
    }

    // async queryIndexer() {
    //     this.logger.debug('queryIndexer executing.');

    //     let changes = false;
    //     let counter = 0;

    //     while (!this.q.isEmpty()) {
    //         const item = this.q.dequeue();
    //         const account = item.account as Account;
    //         const wallet = item.wallet as Wallet;
    //         const network = this.status.getNetwork(account.networkType);
    //         const networkStatus = this.status.get(account.networkType);

    //         // If the current network status is anything other than online, skip indexing.
    //         if (networkStatus && networkStatus.availability != IndexerApiStatus.Online) {
    //             this.logger.warn(`Network ${account.networkType} is not online. Skipping query for indexer state.`);
    //             continue;
    //         }

    //         const indexerUrl = this.settings.values.indexer.replace('{id}', network.id.toLowerCase());

    //         // Loop through all receive addresses until no more data is found:
    //         for (let i = 0; i < account.state.receive.length; i++) {
    //             let receiveAddress = account.state.receive[i];

    //             try {
    //                 let nextLink = `/api/query/address/${receiveAddress.address}/transactions?offset=0&limit=1`;

    //                 const date = new Date().toISOString();

    //                 // Loop through all pages until finished.
    //                 while (nextLink != null) {

    //                     // If there was no transactions from before, create an empty array.
    //                     if (receiveAddress.transactions == null) {
    //                         receiveAddress.transactions = [];
    //                     }

    //                     const responseTransactions = await axios.get(`${indexerUrl}${nextLink}`);
    //                     const transactions = responseTransactions.data;
    //                     const links = this.parseLinkHeader(responseTransactions.headers.link);

    //                     const limit = responseTransactions.headers['pagination-limit'];
    //                     const offset = Number(responseTransactions.headers['pagination-offset']);
    //                     const total = responseTransactions.headers['pagination-total'];

    //                     if (responseTransactions.status == 200) {
    //                         // var updatedReceiveAddress: Address = { ...receiveAddress };
    //                         console.log(responseTransactions);

    //                         // Since we are paging, and all items in pages should be sorted correctly, we can simply
    //                         // replace the item at the right index for each page. This should update with new metadata,
    //                         // if there is anything new.
    //                         for (let j = 0; j < transactions.length; j++) {
    //                             const transaction = transactions[j];
    //                             receiveAddress.transactions[offset + j] = transaction;

    //                             await this.updateTransactionInfo(transaction, indexerUrl);
    //                         }

    //                         // Get all the transaction info for each of the transactions discovered on this address.
    //                         // await this.updateWithTransactionInfo(transactions, indexerUrl);
    //                         // receiveAddress.transactions = transactions;

    //                         // TODO: Add support for paging.
    //                         // Get the unspent outputs. We need to figure out how we should refresh this, as this might change depending on many factors.
    //                         // const responseUnspentTransactions = await axios.get(`${indexerUrl}/api/query/address/${receiveAddress.address}/transactions/unspent?confirmations=0&offset=0&limit=20`);
    //                         // const unspentTransactions: UnspentTransactionOutput[] = responseUnspentTransactions.data;
    //                         // updatedReceiveAddress.unspent = unspentTransactions;
    //                     }

    //                     nextLink = links.next;
    //                 }

    //                 // Persist the date we got this data:
    //                 receiveAddress.retrieved = date;
    //                 changes = true;
    //             } catch (error) {
    //                 this.status.update({ networkType: account.networkType, status: 'Error', availability: IndexerApiStatus.Error });

    //                 this.logger.error(error);

    //                 // TODO: Implement error handling in background and how to send it to UI.
    //                 // We should probably have an error log in settings, so users can see background problems as well.

    //                 // TODO: FIX THIS!!
    //                 // this.communication.sendToAll('error', error);
    //             }

    //             try {
    //                 let nextLink = `/api/query/address/${receiveAddress.address}/transactions/unspent?confirmations=0&offset=0&limit=1`;
    //                 // debugger;

    //                 const date = new Date().toISOString();

    //                 // Loop through all pages until finished.
    //                 while (nextLink != null) {

    //                     // If there was no transactions from before, create an empty array.
    //                     if (receiveAddress.unspent == null) {
    //                         receiveAddress.unspent = [];
    //                     }

    //                     const responseTransactions = await axios.get(`${indexerUrl}${nextLink}`);

    //                     // There are no more items, simply break the loop.
    //                     if (responseTransactions.status == 404) {
    //                         break;
    //                     }

    //                     const unspentTransactions: UnspentTransactionOutput[] = responseTransactions.data;
    //                     receiveAddress.unspent = unspentTransactions;

    //                     const links = this.parseLinkHeader(responseTransactions.headers.link);

    //                     const limit = responseTransactions.headers['pagination-limit'];
    //                     const offset = Number(responseTransactions.headers['pagination-offset']);
    //                     const total = responseTransactions.headers['pagination-total'];

    //                     if (responseTransactions.status == 200) {
    //                         // var updatedReceiveAddress: Address = { ...receiveAddress };
    //                         console.log(unspentTransactions);

    //                         // Since we are paging, and all items in pages should be sorted correctly, we can simply
    //                         // replace the item at the right index for each page. This should update with new metadata,
    //                         // if there is anything new.
    //                         for (let j = 0; j < unspentTransactions.length; j++) {
    //                             const unspent = unspentTransactions[j];
    //                             receiveAddress.unspent[offset + j] = unspent;
    //                         }

    //                     }

    //                     nextLink = links.next;
    //                 }

    //                 // Persist the date we got this data:
    //                 receiveAddress.retrieved = date;
    //                 changes = true;
    //             } catch (error) {
    //                 this.status.update({ networkType: account.networkType, status: 'Error', availability: IndexerApiStatus.Error });

    //                 this.logger.error(error);

    //                 // TODO: Implement error handling in background and how to send it to UI.
    //                 // We should probably have an error log in settings, so users can see background problems as well.
    //                 // TODO: FIX THIS!!!
    //                 // this.communication.sendToAll('error', error);
    //             }
    //         }

    //         console.log(account);
    //         console.log(JSON.stringify(account));

    //         // if (changes) {
    //         //     this.logger.info('There are updated data found during an normal account scan.');
    //         //     // Finally set the date on the account itself.
    //         //     account.state.retrieved = new Date().toISOString();
    //         //     account.state.balance = this.manager.walletManager.calculateBalance(account);
    //         //     account.state.pendingReceived = this.manager.walletManager.calculatePendingReceived(account);
    //         //     account.state.pendingSent = this.manager.walletManager.calculatePendingSent(account);
    //         //     // Save and broadcast for every full account query
    //         //     await this.manager.state.save();
    //         //     this.manager.broadcastState();
    //         // } else {
    //         //     this.logger.debug('No changes during account scan.');
    //         // }

    //         // // Make sure we always watch the latest receive/change addresses.
    //         // // Register watcher for the last receive/change addresses.
    //         // const lastChange = account.state.change[account.state.change.length - 1];
    //         // const lastReceive = account.state.receive[account.state.receive.length - 1];

    //         // // Make the count "-1" which means we'll continue looking at these addresses forever.
    //         // this.a.set(lastChange.address, { change: true, account: account, addressEntry: lastChange, count: -1 });
    //         // this.a.set(lastReceive.address, { change: false, account: account, addressEntry: lastReceive, count: -1 });
    //     }

    //     // TODO: FIX THIS!!
    //     //this.manager.communication.sendToAll('account-scanned');
    // }

    // async queryIndexerLegacy() {
    //     this.logger.debug('queryIndexerLegacy executing.');

    //     let changes = false;
    //     let counter = 0;

    //     while (!this.q.isEmpty()) {
    //         const item = this.q.dequeue();

    //         // These two entries has been sent from
    //         const account = item.account as Account;
    //         const wallet = item.wallet as Wallet;

    //         const network = this.status.getNetwork(account.networkType);
    //         const networkStatus = this.status.get(account.networkType);

    //         // If the current network status is anything other than online, skip indexing.
    //         if (networkStatus && networkStatus.availability != IndexerApiStatus.Online) {
    //             this.logger.warn(`Network ${account.networkType} is not online. Skipping query for indexer state.`);
    //             continue;
    //         }

    //         const indexerUrl = this.settings.values.indexer.replace('{id}', network.id.toLowerCase());

    //         // Loop through all receive addresses until no more data is found:
    //         for (let i = 0; i < account.state.receive.length; i++) {
    //             let receiveAddress = account.state.receive[i];

    //             // If we have already retrieved this, skip to next. We will only query again if
    //             // there is an "force" parameter (to be added later).
    //             if (item.force || !receiveAddress.retrieved) {

    //                 counter++;

    //                 try {
    //                     // We don't have Angular context available in the background, we we'll rely on axios to perform queries:
    //                     const date = new Date().toISOString();
    //                     const response = await axios.get(`${indexerUrl}/api/query/address/${receiveAddress.address}`);
    //                     const data = response.data;

    //                     // Just a minor verification in case the returned data is wrong or scrambled.
    //                     if (receiveAddress.address == data.address) {
    //                         var updatedReceiveAddress: Address = { ...receiveAddress, ...data };

    //                         // Persist the date we got this data:
    //                         updatedReceiveAddress.retrieved = date;

    //                         // Check if the address has been used, then retrieve transaction history.
    //                         if (this.walletManager.hasBeenUsed(updatedReceiveAddress)) {
    //                             // TODO: Add support for paging.
    //                             // TODO: Figure out if we will actually get the full transaction history and persist that to storage. We might simply only query this 
    //                             // when the user want to look at transaction details. Instead we can rely on the unspent API, which give us much less data.
    //                             const responseTransactions = await axios.get(`${indexerUrl}/api/query/address/${receiveAddress.address}/transactions?offset=35&limit=10`);
    //                             const transactions = responseTransactions.data;

    //                             // Get all the transaction info for each of the transactions discovered on this address.
    //                             await this.updateWithTransactionInfo(transactions, indexerUrl);
    //                             updatedReceiveAddress.transactions = transactions;

    //                             // TODO: Add support for paging.
    //                             // Get the unspent outputs. We need to figure out how we should refresh this, as this might change depending on many factors.
    //                             const responseUnspentTransactions = await axios.get(`${indexerUrl}/api/query/address/${receiveAddress.address}/transactions/unspent?confirmations=0&offset=0&limit=20`);
    //                             const unspentTransactions: UnspentTransactionOutput[] = responseUnspentTransactions.data;
    //                             updatedReceiveAddress.unspent = unspentTransactions;
    //                         }

    //                         // Replace the received entry.
    //                         account.state.receive[i] = updatedReceiveAddress;
    //                         changes = true;
    //                     }
    //                 } catch (error) {
    //                     this.status.update({ networkType: account.networkType, status: 'Error', availability: IndexerApiStatus.Error });

    //                     this.logger.error(error);

    //                     // TODO: Implement error handling in background and how to send it to UI.
    //                     // We should probably have an error log in settings, so users can see background problems as well.
    //                     // TODO: FIX!!
    //                     // this.manager.communication.sendToAll('error', error);

    //                     // if (error.error?.title) {
    //                     //     this.snackBar.open('Error: ' + error.error.title, 'Hide', {
    //                     //         duration: 8000,
    //                     //         horizontalPosition: 'center',
    //                     //         verticalPosition: 'bottom',
    //                     //     });
    //                     // } else {
    //                     //     this.snackBar.open('Error: ' + error.message, 'Hide', {
    //                     //         duration: 8000,
    //                     //         horizontalPosition: 'center',
    //                     //         verticalPosition: 'bottom',
    //                     //     });
    //                     // }
    //                 }
    //             }

    //             // For every 5 queried address, we will persist the state and update UI.
    //             // TODO: Verify what this should be based upon user testing and verification of experience.
    //             if (counter > 4) {
    //                 if (changes) {
    //                     account.state.balance = this.walletManager.calculateBalance(account);
    //                     account.state.pendingReceived = this.walletManager.calculatePendingReceived(account);
    //                     account.state.pendingSent = this.walletManager.calculatePendingSent(account);
    //                     await this.state.save();

    //                     // TODO!!
    //                     // this.manager.broadcastState();
    //                 }

    //                 counter = 0;
    //             }

    //             // If we just processed the last entry, check if we should find more receive addresses.
    //             if (i == account.state.receive.length - 1) {
    //                 // Check if the last entry has been used.
    //                 const lastReceiveAddress = account.state.receive[account.state.receive.length - 1];

    //                 // If the last address has been used, generate a new one and query that and continue until all is found.
    //                 if (this.walletManager.hasBeenUsed(lastReceiveAddress)) {
    //                     await this.walletManager.getReceiveAddress(account);
    //                     changes = true;
    //                     // Now the .receive array should have one more entry and the loop should continue.
    //                 }
    //             }
    //         }

    //         // Loop through all change addresses until no more data is found:
    //         for (let i = 0; i < account.state.change.length; i++) {
    //             let changeAddress = account.state.change[i];

    //             // If we have already retrieved this, skip to next. We will only query again if
    //             // there is an "force" parameter (to be added later).
    //             if (item.force || !changeAddress.retrieved) {

    //                 counter++;

    //                 try {
    //                     // We don't have Angular context available in the background, we we'll rely on axios to perform queries:
    //                     const date = new Date().toISOString();
    //                     const response = await axios.get(`${indexerUrl}/api/query/address/${changeAddress.address}`);
    //                     const data = response.data;

    //                     // Just a minor verification in case the returned data is wrong or scrambled.
    //                     if (changeAddress.address == data.address) {
    //                         var updatedChangeAddress = { ...changeAddress, ...data };

    //                         // Persist the date we got this data:
    //                         updatedChangeAddress.retrieved = date;

    //                         // Check if the address has been used, then retrieve transaction history.
    //                         if (this.walletManager.hasBeenUsed(updatedChangeAddress)) {
    //                             // TODO: Add support for paging.
    //                             // TODO: Figure out if we will actually get the full transaction history and persist that to storage. We might simply only query this 
    //                             // when the user want to look at transaction details. Instead we can rely on the unspent API, which give us much less data.
    //                             const responseTransactions = await axios.get(`${indexerUrl}/api/query/address/${changeAddress.address}/transactions?confirmations=0&offset=0&limit=20`);
    //                             const transactions = responseTransactions.data;

    //                             // Get all the transaction info for each of the transactions discovered on this address.
    //                             await this.updateWithTransactionInfo(transactions, indexerUrl);
    //                             updatedChangeAddress.transactions = transactions;

    //                             // TODO: Add support for paging.
    //                             // Get the unspent outputs. We need to figure out how we should refresh this, as this might change depending on many factors.
    //                             const responseUnspentTransactions = await axios.get(`${indexerUrl}/api/query/address/${changeAddress.address}/transactions/unspent?confirmations=0&offset=0&limit=20`);
    //                             const unspentTransactions: UnspentTransactionOutput[] = responseUnspentTransactions.data;
    //                             updatedChangeAddress.unspent = unspentTransactions;
    //                         }

    //                         // Replace the change entry.
    //                         account.state.change[i] = updatedChangeAddress;
    //                         changes = true;
    //                     }
    //                 } catch (error) {
    //                     this.status.update({ networkType: account.networkType, status: 'Error', availability: IndexerApiStatus.Error });

    //                     this.logger.error(error);

    //                     // TODO: Implement error handling in background and how to send it to UI.
    //                     // We should probably have an error log in settings, so users can see background problems as well.
    //                     // TODO: FIX!
    //                     //this.manager.communication.sendToAll('error', error);

    //                     // if (error.error?.title) {
    //                     //     this.snackBar.open('Error: ' + error.error.title, 'Hide', {
    //                     //         duration: 8000,
    //                     //         horizontalPosition: 'center',
    //                     //         verticalPosition: 'bottom',
    //                     //     });
    //                     // } else {
    //                     //     this.snackBar.open('Error: ' + error.message, 'Hide', {
    //                     //         duration: 8000,
    //                     //         horizontalPosition: 'center',
    //                     //         verticalPosition: 'bottom',
    //                     //     });
    //                     // }
    //                 }
    //             }

    //             // For every 5 queried address, we will persist the state and update UI.
    //             // TODO: Verify what this should be based upon user testing and verification of experience.
    //             if (counter > 4) {

    //                 if (changes) {
    //                     account.state.balance = this.walletManager.calculateBalance(account);
    //                     account.state.pendingReceived = this.walletManager.calculatePendingReceived(account);
    //                     account.state.pendingSent = this.walletManager.calculatePendingSent(account);
    //                     await this.state.save();

    //                     // TODO: FIX!
    //                     // this.manager.broadcastState();
    //                 }

    //                 counter = 0;
    //             }

    //             // If we just processed the last entry, check if we should find more change addresses.
    //             if (i == account.state.change.length - 1) {
    //                 // Check if the last entry has been used.
    //                 const lastChangeAddress = account.state.change[account.state.change.length - 1];

    //                 // If the last address has been used, generate a new one and query that and continue until all is found.
    //                 if (this.walletManager.hasBeenUsed(lastChangeAddress)) {
    //                     await this.walletManager.getChangeAddress(account);
    //                     // Now the .change array should have one more entry and the loop should continue.
    //                     changes = true;
    //                 }
    //             }
    //         }

    //         if (changes) {
    //             this.logger.info('There are updated data found during an normal account scan.');
    //             // Finally set the date on the account itself.
    //             account.state.retrieved = new Date().toISOString();
    //             account.state.balance = this.walletManager.calculateBalance(account);
    //             account.state.pendingReceived = this.walletManager.calculatePendingReceived(account);
    //             account.state.pendingSent = this.walletManager.calculatePendingSent(account);
    //             // Save and broadcast for every full account query
    //             await this.state.save();

    //             // TODO: FIX!!
    //             // this.manager.broadcastState();
    //         } else {
    //             this.logger.debug('No changes during account scan.');
    //         }

    //         // Make sure we always watch the latest receive/change addresses.
    //         // Register watcher for the last receive/change addresses.
    //         const lastChange = account.state.change[account.state.change.length - 1];
    //         const lastReceive = account.state.receive[account.state.receive.length - 1];

    //         // Make the count "-1" which means we'll continue looking at these addresses forever.
    //         this.a.set(lastChange.address, { change: true, account: account, addressEntry: lastChange, count: -1 });
    //         this.a.set(lastReceive.address, { change: false, account: account, addressEntry: lastReceive, count: -1 });
    //     }

    //     // TODO: FIX!
    //     //this.manager.communication.sendToAll('account-scanned');
    // }

    // async updateAddressState(indexerUrl: string, addressEntry: Address, change: boolean, data: any, account: Account) {
    //     const date = new Date().toISOString();

    //     var updatedReceiveAddress: Address = { ...addressEntry, ...data };

    //     // Persist the date we got this data:
    //     updatedReceiveAddress.retrieved = date;

    //     // TODO: Add support for paging.
    //     // TODO: Figure out if we will actually get the full transaction history and persist that to storage. We might simply only query this 
    //     // when the user want to look at transaction details. Instead we can rely on the unspent API, which give us much less data.
    //     const responseTransactions = await axios.get(`${indexerUrl}/api/query/address/${addressEntry.address}/transactions?confirmations=0&offset=0&limit=20`);
    //     const transactions = responseTransactions.data;

    //     // Get all the transaction info for each of the transactions discovered on this address.
    //     await this.updateWithTransactionInfo(transactions, indexerUrl);
    //     updatedReceiveAddress.transactions = transactions;

    //     // TODO: Add support for paging.
    //     // Get the unspent outputs. We need to figure out how we should refresh this, as this might change depending on many factors.
    //     const responseUnspentTransactions = await axios.get(`${indexerUrl}/api/query/address/${addressEntry.address}/transactions/unspent?confirmations=0&offset=0&limit=20`);
    //     const unspentTransactions: UnspentTransactionOutput[] = responseUnspentTransactions.data;
    //     updatedReceiveAddress.unspent = unspentTransactions;

    //     // Replace the entry.
    //     if (change) {
    //         account.state.change[addressEntry.index] = updatedReceiveAddress;
    //     }
    //     else {
    //         account.state.receive[addressEntry.index] = updatedReceiveAddress;
    //     }

    //     // Finally set the date on the account itself.
    //     account.state.retrieved = new Date().toISOString();
    //     account.state.balance = this.walletManager.calculateBalance(account);
    //     account.state.pendingReceived = this.walletManager.calculatePendingReceived(account);
    //     account.state.pendingSent = this.walletManager.calculatePendingSent(account);

    //     await this.state.save();

    //     // TODO: FIX!!
    //     // this.manager.broadcastState();
    // }

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