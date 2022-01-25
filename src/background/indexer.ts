import { Account, Address, Transaction, UnspentTransactionOutput, Wallet } from '../app/interfaces';
import { AppManager } from './application-manager';

//const axios = require('axios');
// In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with require() use the following approach:
const axios = require('axios').default;

class Queue {
    items: any[];

    constructor(...params: any[]) {
        console.log(params);
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

    constructor(private manager: AppManager) {

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

    async updateWithTransactionInfo(transactions: Transaction[], indexerUrl: string) {
        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];
            const responseTransaction = await axios.get(`${indexerUrl}/api/query/transaction/${transaction.transactionHash}`);
            transaction.details = responseTransaction.data;
        }
    }

    async broadcastTransaction(txhex: string) {
        debugger;
        // These two entries has been sent from
        const account = this.manager.walletManager.activeAccount;

        const network = this.manager.getNetwork(account.network, account.purpose);
        const indexerUrl = this.manager.state.persisted.settings.indexer.replace('{id}', network.id.toLowerCase());

        const date = new Date().toISOString();
        const response = await axios.post(`${indexerUrl}/api/post/send`, txhex);
        const data = response.data;
    }

    async queryIndexer() {
        let counter = 0;

        while (!this.q.isEmpty()) {
            const item = this.q.dequeue();

            // These two entries has been sent from
            const account = item.account as Account;
            const wallet = item.wallet as Wallet;

            const network = this.manager.getNetwork(account.network, account.purpose);
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

                                debugger;

                                // TODO: Add support for paging.
                                // Get the unspent outputs. We need to figure out how we should refresh this, as this might change depending on many factors.
                                const responseUnspentTransactions = await axios.get(`${indexerUrl}/api/query/address/${receiveAddress.address}/transactions/unspent?confirmations=0&offset=0&limit=20`);
                                const unspentTransactions: UnspentTransactionOutput[] = responseUnspentTransactions.data;
                                updatedReceiveAddress.unspent = unspentTransactions;
                            }

                            // Replace the received entry.
                            account.state.receive[i] = updatedReceiveAddress;
                        }
                    } catch (error) {
                        console.error(error);

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
                    account.state.balance = this.manager.walletManager.calculateBalance(account);
                    await this.manager.state.save();
                    this.manager.broadcastState();
                    counter = 0;
                }

                // If we just processed the last entry, check if we should find more receive addresses.
                if (i == account.state.receive.length - 1) {
                    // Check if the last entry has been used.
                    const lastReceiveAddress = account.state.receive[account.state.receive.length - 1];

                    // If the last address has been used, generate a new one and query that and continue until all is found.
                    if (this.manager.walletManager.hasBeenUsed(lastReceiveAddress)) {
                        await this.manager.walletManager.getReceiveAddress(account);
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

                                debugger;

                                // TODO: Add support for paging.
                                // Get the unspent outputs. We need to figure out how we should refresh this, as this might change depending on many factors.
                                const responseUnspentTransactions = await axios.get(`${indexerUrl}/api/query/address/${changeAddress.address}/transactions/unspent?confirmations=0&offset=0&limit=20`);
                                const unspentTransactions: UnspentTransactionOutput[] = responseUnspentTransactions.data;
                                updatedChangeAddress.unspent = unspentTransactions;
                            }

                            // Replace the change entry.
                            account.state.change[i] = updatedChangeAddress;
                        }
                    } catch (error) {
                        console.error(error);

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
                    account.state.balance = this.manager.walletManager.calculateBalance(account);
                    await this.manager.state.save();
                    this.manager.broadcastState();
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
                    }
                }
            }

            // Finally set the date on the account itself.
            account.state.retrieved = new Date().toISOString();

            account.state.balance = this.manager.walletManager.calculateBalance(account);
            // Save and broadcast for every full account query
            await this.manager.state.save();
            this.manager.broadcastState();
        }

        this.manager.communication.sendToAll('account-scanned');
    }
}