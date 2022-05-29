import { Injectable } from "@angular/core";
import Big from "big.js";
import { Account, AccountUnspentTransactionOutput, Address, SettingStore, UnspentTransactionOutput } from "src/shared";
import { AccountStateStore } from "src/shared/store/account-state-store";
import { NetworkLoader } from ".";
import { LoggerService } from "./logger.service";

@Injectable({
    providedIn: 'root'
})
/** Service that will query the indexer API for unspent transaction outputs (UTXO). */
export class UnspentOutputService {
    private limit = 20;

    constructor(private networkLoader: NetworkLoader, private logger: LoggerService, private settingStore: SettingStore, private accountStateStore: AccountStateStore) {

    }

    async getUnspentByAmount(requiredAmount: Big, account: Account) {
        // Query all known addresses in the account. We will not be deriving new address and query those in this service, this is the responsbility of the indexer service.
        // This service is used when sending, and then we will base logic upon what is already known to be available.

        const settings = this.settingStore.get();
        const network = this.networkLoader.getNetwork(account.networkType);
        const indexerUrl = this.networkLoader.getServer(network.id, settings.server, settings.indexer);
        const accountState = this.accountStateStore.get(account.identifier);

        let aggregatedAmount = Big(0);
        let completed = false;

        // aggregatedAmount.minus(amount).minus(fee);

        let utxo: UnspentTransactionOutput[] = [];

        // Process receive addresses until we've exhausted them.
        for (let k = 0; k < accountState.receive.length; k++) {
            const address = accountState.receive[k];

            // Query for what is left, take the required minus what we have already aggregated.
            const processState = await this.processAddress(indexerUrl, address, requiredAmount.minus(aggregatedAmount));

            this.logger.debug(`Process state on address ${address.address}:`, processState);

            // Add the amount from address processing into the aggreated amount.
            aggregatedAmount = aggregatedAmount.plus(processState.amount);

            this.logger.debug('processState.utxo:', processState);

            utxo.push(...processState.utxo);

            // If completed, it means we have reached the required amount.
            if (processState.completed) {
                this.logger.debug('SETTING COMPLETED TO TRUE AND BREAKING!');
                completed = true;
                break;
            }
        }

        if (completed == false) {
            // Process change addresses until we've exhausted them.
            for (let k = 0; k < accountState.change.length; k++) {
                const address = accountState.change[k];

                // Query for what is left, take the required minus what we have already aggregated.
                const processState = await this.processAddress(indexerUrl, address, requiredAmount.minus(aggregatedAmount));

                this.logger.debug(`Process state on address ${address.address}:`, processState);

                // Add the amount from address processing into the aggreated amount.
                aggregatedAmount = aggregatedAmount.plus(processState.amount);

                this.logger.debug('processState.utxo:', processState);

                utxo.push(...processState.utxo);

                // If completed, it means we have reached the required amount.
                if (processState.completed) {
                    this.logger.debug('SETTING COMPLETED TO TRUE AND BREAKING!');
                    completed = true;
                    break;
                }
            }
        }

        this.logger.debug('Performing mapping of all data...');

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

        this.logger.debug('utxo: ', utxo);
        this.logger.debug('spendable: ', spendable);

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
        this.logger.debug('processAddress: start');
        let changes = false;
        let completed = false;
        let amount = Big(0);
        let countProcessedItems = 0;
        let utxo: UnspentTransactionOutput[] = [];

        try {
            let nextLink = `/api/query/address/${address.address}/transactions/unspent?confirmations=0&offset=0&limit=${this.limit}`;
            const date = new Date().toISOString();
            const clonedIndexerUrl = indexerUrl.slice();

            // Loop through all pages until finished.
            while (nextLink != null) {
                const url = `${clonedIndexerUrl}${nextLink}`;
                this.logger.debug(`nextlink: ${url}`);

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
                        this.logger.debug('UTXO:', transaction);

                        const transactionId = transaction.outpoint.transactionId;
                        const index = transaction.outpoint.outputIndex;

                        utxo.push(transaction);

                        // Increment the amount we have found on this address.
                        amount = amount.plus(transaction.value);

                        this.logger.debug('Amount: ' + amount.toString());

                        // If the amount aggregated has reached what is required, we're done.
                        if (amount.gte(requiredAmount)) {
                            this.logger.debug('AMOUNT IS GREATER THAN REQUIRED! QUERY COMPLETE!');

                            nextLink = null;
                            completed = true;
                            break;
                        }
                    }
                }

                // Only set the next link if the current one is not null. This is because we are breaking when we have
                // found the correct amount and we don't want to continue.
                if (nextLink != null) {
                    nextLink = links.next;
                }
            }

        } catch (error) {
            this.logger.error('Failed to query indexer!!');
            // TODO: Implement error handling in background and how to send it to UI.
            // We should probably have an error log in settings, so users can see background problems as well.
        }

        this.logger.debug('processAddress: end');

        return { changes, completed, amount, utxo };
    }

}
