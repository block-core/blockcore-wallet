import { address } from '@blockcore/blockcore-js';
import { Account, Address, IndexerApiStatus, Logger, Transaction, UnspentTransactionOutput, Wallet } from '../app/interfaces';
import { AppManager } from './application-manager';
import axiosRetry from 'axios-retry';

//const axios = require('axios');
// In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with require() use the following approach:
const axios = require('axios').default;
axiosRetry(axios, { retries: 3 });

class Queue {
    items: any[];

    constructor(...params: any[]) {
        this.items = [...params];
    }

    enqueue(item: any) {
        this.items.push(item);
    }

    dequeue() {
        return this.items.shift();
    }

    getItems() {
        return this.items
    }

    isEmpty() {
        return this.items.length == 0;
    }

    peek() {
        return !this.isEmpty() ? this.items[0] : undefined;
    }

    length() {
        return this.items.length;
    }
}

/** Service that handles queries against the blockchain indexer to retrieve data for accounts. Runs in the background. */
export class IndexerService {
    private q = new Queue();
    private a = new Map<string, { change: boolean, account: Account, addressEntry: Address, count: number }>();
    private logger: Logger;

    constructor(
        private manager: AppManager,
    ) {
        this.logger = manager.logger;
        // On interval loop through all watched addresses.
        setInterval(async () => {
            await this.watchIndexer();
        }, 15000);
    }

    watchAddress(address: string, account: Account) {
        // Check if the address is already watched.
        const item = this.a.get(address);

        if (item) {
            return;
        }

        let addressEntry = account.state.receive.find(a => a.address == address)
        let change = false;

        if (!addressEntry) {
            addressEntry = account.state.change.find(a => a.address == address);
            change = true;
        }

        // Queue up a watcher that has the address, account it belongs to and balance at the time.
        this.a.set(address, { change, account, addressEntry, count: 0 });
    }

    process(account: Account, wallet: Wallet, force: boolean) {
        const empty = this.q.isEmpty();

        // Registers in queue processing of the account in specific wallet.
        this.q.enqueue({ account, wallet, force });

        // If the queue is empty, we'll schedule processing with a timeout.
        if (empty) {
            // Queue up in one second
            setTimeout(async () => {
                await this.queryIndexer();
            }, 1000);
        }
    }

    hasWork() {
        return !this.q.isEmpty();
    }

    async getTransactionHex(account: Account, txid: string) {
        const network = this.manager.getNetwork(account.networkType);
        const indexerUrl = this.manager.state.persisted.settings.indexer.replace('{id}', network.id.toLowerCase());

        const responseTransactionHex = await axios.get(`${indexerUrl}/api/query/transaction/${txid}/hex`);
        return responseTransactionHex.data;
    }

    async updateWithTransactionInfo(transactions: Transaction[], indexerUrl: string) {
        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];
            const responseTransaction = await axios.get(`${indexerUrl}/api/query/transaction/${transaction.transactionHash}`);
            transaction.details = responseTransaction.data;

            const responseTransactionHex = await axios.get(`${indexerUrl}/api/query/transaction/${transaction.transactionHash}/hex`);
            transaction.hex = responseTransactionHex.data;
        }
    }

    async broadcastTransaction(account: Account, txhex: string) {
        // These two entries has been sent from
        const network = this.manager.getNetwork(account.networkType);
        const indexerUrl = this.manager.state.persisted.settings.indexer.replace('{id}', network.id.toLowerCase());

        const response = await axios.post(`${indexerUrl}/api/command/send`, txhex, {
            headers: {
                'Content-Type': 'application/json-patch+json',
            }
        });
        const data = response.data;

        this.logger.debug('Should contain transaction ID if broadcast was OK:', data);

        return data;
    }

    async queryIndexer() {
        this.logger.debug('queryIndexer executing.');

        let changes = false;
        let counter = 0;

        while (!this.q.isEmpty()) {
            const item = this.q.dequeue();

            // These two entries has been sent from
            const account = item.account as Account;
            const wallet = item.wallet as Wallet;

            const network = this.manager.getNetwork(account.networkType);
            const networkStatus = this.manager.status.get(account.networkType);

            // If the current network status is anything other than online, skip indexing.
            if (networkStatus && networkStatus.availability != IndexerApiStatus.Online) {
                this.logger.warn(`Network ${account.networkType} is not online. Skipping query for indexer state.`);
                continue;
            }

            const indexerUrl = this.manager.state.persisted.settings.indexer.replace('{id}', network.id.toLowerCase());

            // Loop through all receive addresses until no more data is found:
            for (let i = 0; i < account.state.receive.length; i++) {
                let receiveAddress = account.state.receive[i];

                // If we have already retrieved this, skip to next. We will only query again if
                // there is an "force" parameter (to be added later).
                if (item.force || !receiveAddress.retrieved) {

                    counter++;

                    try {
                        // We don't have Angular context available in the background, we we'll rely on axios to perform queries:
                        const date = new Date().toISOString();
                        const response = await axios.get(`${indexerUrl}/api/query/address/${receiveAddress.address}`);
                        const data = response.data;

                        // Just a minor verification in case the returned data is wrong or scrambled.
                        if (receiveAddress.address == data.address) {
                            var updatedReceiveAddress: Address = { ...receiveAddress, ...data };

                            // Persist the date we got this data:
                            updatedReceiveAddress.retrieved = date;

                            // Check if the address has been used, then retrieve transaction history.
                            if (this.manager.walletManager.hasBeenUsed(updatedReceiveAddress)) {
                                // TODO: Add support for paging.
                                // TODO: Figure out if we will actually get the full transaction history and persist that to storage. We might simply only query this 
                                // when the user want to look at transaction details. Instead we can rely on the unspent API, which give us much less data.
                                const responseTransactions = await axios.get(`${indexerUrl}/api/query/address/${receiveAddress.address}/transactions?confirmations=0&offset=0&limit=20`);
                                const transactions = responseTransactions.data;

                                // Get all the transaction info for each of the transactions discovered on this address.
                                await this.updateWithTransactionInfo(transactions, indexerUrl);
                                updatedReceiveAddress.transactions = transactions;

                                // TODO: Add support for paging.
                                // Get the unspent outputs. We need to figure out how we should refresh this, as this might change depending on many factors.
                                const responseUnspentTransactions = await axios.get(`${indexerUrl}/api/query/address/${receiveAddress.address}/transactions/unspent?confirmations=0&offset=0&limit=20`);
                                const unspentTransactions: UnspentTransactionOutput[] = responseUnspentTransactions.data;
                                updatedReceiveAddress.unspent = unspentTransactions;
                            }

                            // Replace the received entry.
                            account.state.receive[i] = updatedReceiveAddress;
                            changes = true;
                        }
                    } catch (error) {
                        this.manager.status.update({ networkType: account.networkType, status: 'Error', availability: IndexerApiStatus.Error });

                        this.logger.error(error);

                        // TODO: Implement error handling in background and how to send it to UI.
                        // We should probably have an error log in settings, so users can see background problems as well.
                        this.manager.communication.sendToAll('error', error);

                        // if (error.error?.title) {
                        //     this.snackBar.open('Error: ' + error.error.title, 'Hide', {
                        //         duration: 8000,
                        //         horizontalPosition: 'center',
                        //         verticalPosition: 'bottom',
                        //     });
                        // } else {
                        //     this.snackBar.open('Error: ' + error.message, 'Hide', {
                        //         duration: 8000,
                        //         horizontalPosition: 'center',
                        //         verticalPosition: 'bottom',
                        //     });
                        // }
                    }
                }

                // For every 5 queried address, we will persist the state and update UI.
                // TODO: Verify what this should be based upon user testing and verification of experience.
                if (counter > 4) {
                    if (changes) {
                        account.state.balance = this.manager.walletManager.calculateBalance(account);
                        await this.manager.state.save();
                        this.manager.broadcastState();
                    }

                    counter = 0;
                }

                // If we just processed the last entry, check if we should find more receive addresses.
                if (i == account.state.receive.length - 1) {
                    // Check if the last entry has been used.
                    const lastReceiveAddress = account.state.receive[account.state.receive.length - 1];

                    // If the last address has been used, generate a new one and query that and continue until all is found.
                    if (this.manager.walletManager.hasBeenUsed(lastReceiveAddress)) {
                        await this.manager.walletManager.getReceiveAddress(account);
                        changes = true;
                        // Now the .receive array should have one more entry and the loop should continue.
                    }
                }
            }

            // Loop through all change addresses until no more data is found:
            for (let i = 0; i < account.state.change.length; i++) {
                let changeAddress = account.state.change[i];

                // If we have already retrieved this, skip to next. We will only query again if
                // there is an "force" parameter (to be added later).
                if (item.force || !changeAddress.retrieved) {

                    counter++;

                    try {
                        // We don't have Angular context available in the background, we we'll rely on axios to perform queries:
                        const date = new Date().toISOString();
                        const response = await axios.get(`${indexerUrl}/api/query/address/${changeAddress.address}`);
                        const data = response.data;

                        // Just a minor verification in case the returned data is wrong or scrambled.
                        if (changeAddress.address == data.address) {
                            var updatedChangeAddress = { ...changeAddress, ...data };

                            // Persist the date we got this data:
                            updatedChangeAddress.retrieved = date;

                            // Check if the address has been used, then retrieve transaction history.
                            if (this.manager.walletManager.hasBeenUsed(updatedChangeAddress)) {
                                // TODO: Add support for paging.
                                // TODO: Figure out if we will actually get the full transaction history and persist that to storage. We might simply only query this 
                                // when the user want to look at transaction details. Instead we can rely on the unspent API, which give us much less data.
                                const responseTransactions = await axios.get(`${indexerUrl}/api/query/address/${changeAddress.address}/transactions?confirmations=0&offset=0&limit=20`);
                                const transactions = responseTransactions.data;

                                // Get all the transaction info for each of the transactions discovered on this address.
                                await this.updateWithTransactionInfo(transactions, indexerUrl);
                                updatedChangeAddress.transactions = transactions;

                                // TODO: Add support for paging.
                                // Get the unspent outputs. We need to figure out how we should refresh this, as this might change depending on many factors.
                                const responseUnspentTransactions = await axios.get(`${indexerUrl}/api/query/address/${changeAddress.address}/transactions/unspent?confirmations=0&offset=0&limit=20`);
                                const unspentTransactions: UnspentTransactionOutput[] = responseUnspentTransactions.data;
                                updatedChangeAddress.unspent = unspentTransactions;
                            }

                            // Replace the change entry.
                            account.state.change[i] = updatedChangeAddress;
                            changes = true;
                        }
                    } catch (error) {
                        this.manager.status.update({ networkType: account.networkType, status: 'Error', availability: IndexerApiStatus.Error });

                        this.logger.error(error);

                        // TODO: Implement error handling in background and how to send it to UI.
                        // We should probably have an error log in settings, so users can see background problems as well.
                        this.manager.communication.sendToAll('error', error);

                        // if (error.error?.title) {
                        //     this.snackBar.open('Error: ' + error.error.title, 'Hide', {
                        //         duration: 8000,
                        //         horizontalPosition: 'center',
                        //         verticalPosition: 'bottom',
                        //     });
                        // } else {
                        //     this.snackBar.open('Error: ' + error.message, 'Hide', {
                        //         duration: 8000,
                        //         horizontalPosition: 'center',
                        //         verticalPosition: 'bottom',
                        //     });
                        // }
                    }
                }

                // For every 5 queried address, we will persist the state and update UI.
                // TODO: Verify what this should be based upon user testing and verification of experience.
                if (counter > 4) {

                    if (changes) {
                        account.state.balance = this.manager.walletManager.calculateBalance(account);
                        await this.manager.state.save();
                        this.manager.broadcastState();
                    }

                    counter = 0;
                }

                // If we just processed the last entry, check if we should find more change addresses.
                if (i == account.state.change.length - 1) {
                    // Check if the last entry has been used.
                    const lastChangeAddress = account.state.change[account.state.change.length - 1];

                    // If the last address has been used, generate a new one and query that and continue until all is found.
                    if (this.manager.walletManager.hasBeenUsed(lastChangeAddress)) {
                        await this.manager.walletManager.getChangeAddress(account);
                        // Now the .change array should have one more entry and the loop should continue.
                        changes = true;
                    }
                }
            }

            if (changes) {
                this.logger.info('There are updated data found during an normal account scan.');
                // Finally set the date on the account itself.
                account.state.retrieved = new Date().toISOString();
                account.state.balance = this.manager.walletManager.calculateBalance(account);
                // Save and broadcast for every full account query
                await this.manager.state.save();
                this.manager.broadcastState();
            } else {
                this.logger.debug('No changes during account scan.');
            }

            // Make sure we always watch the latest receive/change addresses.
            // Register watcher for the last receive/change addresses.
            const lastChange = account.state.change[account.state.change.length - 1];
            const lastReceive = account.state.receive[account.state.receive.length - 1];

            // Make the count "-1" which means we'll continue looking at these addresses forever.
            this.a.set(lastChange.address, { change: true, account: account, addressEntry: lastChange, count: -1 });
            this.a.set(lastReceive.address, { change: false, account: account, addressEntry: lastReceive, count: -1 });
        }

        this.manager.communication.sendToAll('account-scanned');
    }

    async updateAddressState(indexerUrl: string, addressEntry: Address, change: boolean, data: any, account: Account) {
        const date = new Date().toISOString();

        var updatedReceiveAddress: Address = { ...addressEntry, ...data };

        // Persist the date we got this data:
        updatedReceiveAddress.retrieved = date;

        // TODO: Add support for paging.
        // TODO: Figure out if we will actually get the full transaction history and persist that to storage. We might simply only query this 
        // when the user want to look at transaction details. Instead we can rely on the unspent API, which give us much less data.
        const responseTransactions = await axios.get(`${indexerUrl}/api/query/address/${addressEntry.address}/transactions?confirmations=0&offset=0&limit=20`);
        const transactions = responseTransactions.data;

        // Get all the transaction info for each of the transactions discovered on this address.
        await this.updateWithTransactionInfo(transactions, indexerUrl);
        updatedReceiveAddress.transactions = transactions;

        // TODO: Add support for paging.
        // Get the unspent outputs. We need to figure out how we should refresh this, as this might change depending on many factors.
        const responseUnspentTransactions = await axios.get(`${indexerUrl}/api/query/address/${addressEntry.address}/transactions/unspent?confirmations=0&offset=0&limit=20`);
        const unspentTransactions: UnspentTransactionOutput[] = responseUnspentTransactions.data;
        updatedReceiveAddress.unspent = unspentTransactions;

        // Replace the entry.
        if (change) {
            account.state.change[addressEntry.index] = updatedReceiveAddress;
        }
        else {
            account.state.receive[addressEntry.index] = updatedReceiveAddress;
        }

        // Finally set the date on the account itself.
        account.state.retrieved = new Date().toISOString();
        account.state.balance = this.manager.walletManager.calculateBalance(account);

        await this.manager.state.save();
        this.manager.broadcastState();
    }

    async watchIndexer() {
        this.logger.info('watchIndexer executing.', this.a);

        this.a.forEach(async (value, key) => {
            const account = value.account;
            const addressEntry = value.addressEntry;
            const network = this.manager.getNetwork(account.networkType);
            const indexerUrl = this.manager.state.persisted.settings.indexer.replace('{id}', network.id.toLowerCase());
            const networkStatus = this.manager.status.get(account.networkType);

            // If the current network status is anything other than online, skip indexing.
            if (networkStatus && networkStatus.availability != IndexerApiStatus.Online) {
                this.logger.warn(`Network ${account.networkType} is not online. Skipping query for indexer state.`);

            } else {
                try {
                    // We don't have Angular context available in the background, we we'll rely on axios to perform queries:
                    const date = new Date().toISOString();
                    const response = await axios.get(`${indexerUrl}/api/query/address/${addressEntry.address}`);
                    const data = response.data;

                    // If there is any difference in the balance, make sure we update!
                    if (addressEntry.balance != data.balance) {
                        this.logger.info('BALANCE IS DIFFERENT, UPDATE STATE!', addressEntry.balance, data.balance, data);
                        debugger;
                        await this.updateAddressState(indexerUrl, value.addressEntry, value.change, data, account);

                        // Stop watching this address.
                        this.a.delete(key);
                    } else if (data.pendingSent > 0 || data.pendingReceived > 0) {
                        this.logger.info('PENDING, UPDATE STATE!');

                        // If there is any pending, we'll continue watching this address.
                        await this.updateAddressState(indexerUrl, value.addressEntry, value.change, data, account);
                        // Continue watching this address as long as there is pending, when pending becomes 0, the balance should hopefully
                        // be updated and one final update will be performed before removing this watch entry.
                    } else {
                        // -1 means we will process forever until this address has been used and spent.
                        if (value.count === -1) {
                            this.logger.debug('Will continue to process until change discovered: ', value);
                        } else {
                            // If there are no difference in balance and no pending and we've queried already 10 times (10 * 10 seconds), we'll
                            // stop watching this address.
                            value.count = value.count + 1;

                            this.logger.debug('Will continue to process for a little longer: ', value.count);

                            if (value.count > 10) {
                                // When finished, remove from the list.
                                this.logger.debug('Watching was finished, removing: ', key);
                                this.a.delete(key);
                            }
                        }
                    }
                } catch (error) {
                    this.manager.status.update({ networkType: account.networkType, status: 'Error', availability: IndexerApiStatus.Error });
                    account.networkStatus = 'Error';

                    this.logger.error(error);
                    // TODO: Implement error handling in background and how to send it to UI.
                    // We should probably have an error log in settings, so users can see background problems as well.
                    this.manager.communication.sendToAll('error', error);
                }
            }
        });
    }
}