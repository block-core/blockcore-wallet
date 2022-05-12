import { Injectable } from "@angular/core";
import Big from "big.js";
import { Account, AccountUnspentTransactionOutput, Address, SettingStore, UnspentTransactionOutput } from "src/shared";
import { NetworkLoader } from ".";

@Injectable({
    providedIn: 'root'
})
/** Service that will query the indexer API for unspent transaction outputs (UTXO). */
export class UnspentOutputService {
    private limit = 20;

    constructor(private networkLoader: NetworkLoader, private settingStore: SettingStore) {

    }

    async getUnspentByAmount(requiredAmount: Big, account: Account) {
        // Query all known addresses in the account. We will not be deriving new address and query those in this service, this is the responsbility of the indexer service.
        // This service is used when sending, and then we will base logic upon what is already known to be available.

        const settings = this.settingStore.get();
        const network = this.networkLoader.getNetwork(account.networkType);
        const indexerUrl = this.networkLoader.getServer(network.id, settings.server, settings.indexer);

        let aggregatedAmount = Big(0);
        let completed = false;

        // aggregatedAmount.minus(amount).minus(fee);

        let utxo: UnspentTransactionOutput[] = [];

        // Process receive addresses until we've exhausted them.
        for (let k = 0; k < account.state.receive.length; k++) {
            const address = account.state.receive[k];

            // Query for what is left, take the required minus what we have already aggregated.
            const processState = await this.processAddress(indexerUrl, address, requiredAmount.minus(aggregatedAmount));

            console.log(`Process state on address ${address.address}:`, processState);

            // Add the amount from address processing into the aggreated amount.
            aggregatedAmount = aggregatedAmount.plus(processState.amount);

            console.log('processState.utxo:', processState);

            utxo.push(...processState.utxo);

            // If completed, it means we have reached the required amount.
            if (processState.completed) {
                console.log('SETTING COMPLETED TO TRUE AND BREAKING!');
                completed = true;
                break;
            }

            // const tx = unspent[i];
            // aggregatedAmount = aggregatedAmount.plus(new Big(tx.balance));

            // inputs.push(tx);

            // if (aggregatedAmount.gte(requiredAmount)) {
            //     break;
            // }
        }

        if (completed == false) {
            // Process change addresses until we've exhausted them.
            for (let k = 0; k < account.state.change.length; k++) {
                const address = account.state.change[k];

                // Query for what is left, take the required minus what we have already aggregated.
                const processState = await this.processAddress(indexerUrl, address, requiredAmount.minus(aggregatedAmount));
    
                console.log(`Process state on address ${address.address}:`, processState);
    
                // Add the amount from address processing into the aggreated amount.
                aggregatedAmount = aggregatedAmount.plus(processState.amount);
    
                console.log('processState.utxo:', processState);
    
                utxo.push(...processState.utxo);
    
                // If completed, it means we have reached the required amount.
                if (processState.completed) {
                    console.log('SETTING COMPLETED TO TRUE AND BREAKING!');
                    completed = true;
                    break;
                }
    
                // const tx = unspent[i];
                // aggregatedAmount = aggregatedAmount.plus(new Big(tx.balance));
    
                // inputs.push(tx);
    
                // if (aggregatedAmount.gte(requiredAmount)) {
                //     break;
                // }
            }
        }

        console.log('Performing mapping of all data...');

        let spendable = utxo.map<AccountUnspentTransactionOutput>((t) => {
            return {
                address: t.address,
                balance: t.value,
                index: t.outpoint.outputIndex,
                transactionHash: t.outpoint.transactionId,
                unconfirmed: false,
                hex: null
            }
        });

        console.log('utxo: ', utxo);
        console.log('spendable: ', spendable);

        return { amount: aggregatedAmount, utxo: spendable };
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

    async processAddress(indexerUrl: string, address: Address, requiredAmount: Big) {
        console.log('processAddress: start');
        let changes = false;
        let completed = false;
        let amount = Big(0);
        let countProcessedItems = 0;
        let utxo: UnspentTransactionOutput[] = [];

        try {
            let nextLink = `/api/query/address/${address.address}/transactions/unspent?confirmations=0&offset=0&limit=${this.limit}`;
            const date = new Date().toISOString();
            const clonedIndexerUrl = indexerUrl.slice();
            console.log(`indexerUrl ${indexerUrl} cloned into ${clonedIndexerUrl}`);

            // Loop through all pages until finished.
            while (nextLink != null) {
                const url = `${clonedIndexerUrl}${nextLink}`;
                console.log(`nextlink url ${url}`);

                // Default options are marked with *
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

                const transactions = await response.json();
                // const responseTransactions = await axios.get(`${indexerUrl}${nextLink}`);
                // const transactions = responseTransactions.data;
                const links = this.parseLinkHeader(response.headers.get('link'));

                // const limit = response.headers.get('pagination-limit');
                // const total = response.headers.get('pagination-total');
                // const offset = Number(response.headers.get('pagination-offset'));

                // Increase the count process items, used to buffer large addresses.
                countProcessedItems += this.limit;

                if (response.ok) {
                    for (let j = 0; j < transactions.length; j++) {
                        changes = true;

                        const transaction: UnspentTransactionOutput = transactions[j];
                        console.log('UTXO:', transaction);

                        const transactionId = transaction.outpoint.transactionId;
                        const index = transaction.outpoint.outputIndex;

                        utxo.push(transaction);

                        // Increment the amount we have found on this address.
                        amount = amount.plus(transaction.value);

                        console.log('Amount: ' + amount.toString());

                        // If the amount aggregated has reached what is required, we're done.
                        if (amount.gte(requiredAmount)) {
                            console.log('AMOUNT IS GREATER THAN REQUIRED! QUERY COMPLETE!');

                            nextLink = null;
                            completed = true;
                            break;
                        }

                        // Keep updating with transaction info details until finalized (and it will no longer be returned in the paged query):
                        // transaction.details = await this.getTransactionInfo(transactionId, clonedIndexerUrl);

                        // Copy some of the details state to the container object.
                        // transaction.confirmations = transaction.details.confirmations;

                        // If the transaction ID is not present already on the AddressState, add it.
                        // if (index == -1) {
                        //     state.transactions.push(transactionId);
                        // }

                        // transaction.unconfirmed = (transaction.confirmations < this.confirmed);
                        // transaction.finalized = (transaction.confirmations >= this.finalized);

                        // // Whenever we reseach finalized transactions, move the offset state forward.
                        // if (transaction.finalized) {
                        //     state.offset = offset + (j + 1);
                        // }

                        // TODO: Temporarily drop this while testing a large wallet.
                        // TODO: We have now implemented on-demand retreival of hex when sending, investigate if that is better and more proper as
                        // there is no value in getting spent data.
                        // if (!transaction.hex) {
                        //     transaction.hex = await this.getTransactionHex(transactionId, indexerUrl);
                        // }

                        // Update the store with latest info on the transaction.
                        // this.transactionStore.set(transactionId, transaction);

                        // // Persist immediately because the watcher need to have
                        // await this.transactionStore.save();
                    }
                }

                nextLink = links.next;
            }

        } catch (error) {
            console.log('Failed to query indexer!!');
            console.error(error);
            // TODO: Implement error handling in background and how to send it to UI.
            // We should probably have an error log in settings, so users can see background problems as well.
        }

        console.log('processAddress: end');

        return { changes, completed, amount, utxo };
    }

}
