import { AddressManager } from "./address-manager";
import { IndexerBackgroundService } from "./indexer";
import { AccountUnspentTransactionOutput, TransactionHistory } from "./interfaces";
import { NetworkLoader } from "./network-loader";
import { AddressStore, SettingStore, TransactionStore, WalletStore, AccountHistoryStore } from "./store";

export class BackgroundManager {
    constructor() {

    }

    async runIndexer() {
        // First update all the data.
        const settingStore = new SettingStore();
        await settingStore.load();

        const walletStore = new WalletStore();
        await walletStore.load();

        const addressStore = new AddressStore();
        await addressStore.load();

        const transactionStore = new TransactionStore();
        await transactionStore.load();

        const accountHistoryStore = new AccountHistoryStore();
        await accountHistoryStore.load();

        const networkLoader = new NetworkLoader();
        const addressManager = new AddressManager(networkLoader);

        // const lightWalletManager = new LightWalletManager(walletState.getWallets());
        // lightWalletManager.getWallets();

        // Get what addresses to watch from local storage.
        // globalThis.chrome.storage.local.get('')
        const indexer = new IndexerBackgroundService(settingStore, walletStore, addressStore, transactionStore, addressManager);
        const changes = await indexer.process();

        // If there are no changes, don't re-calculate the balance.
        if (!changes) {
            return false;
        }

        console.log('INDEXER COMPLETED RUN!');

        console.log(walletStore);
        console.log(addressStore);
        console.log(transactionStore);

        // Then calculate the balance.
        const wallets = walletStore.all();
        const addressStates = addressStore.all();
        const transactions = transactionStore.all();

        for (let i = 0; i < wallets.length; i++) {
            const wallet = wallets[i];

            // Then calculate the balance.
            const accounts = wallet.accounts;

            for (let j = 0; j < accounts.length; j++) {
                const account = accounts[j];

                console.log('account:', account);

                const receive = account.state.receive; // .flatMap(i => i.unspent).filter(i => i !== undefined);
                const change = account.state.change; // .flatMap(i => i.unspent).filter(i => i !== undefined);
                const addressesList = [...receive, ...change];
                const addresses = addressesList.flatMap(a => a.address);

                console.log('addresses:', addresses);

                const addressStatesInThisAccount = addressStates.filter(a => addresses.indexOf(a.address) > -1);

                console.log('addressStatesInThisAccount:', addressStatesInThisAccount);

                const transactionHashesInAccount = addressStatesInThisAccount.flatMap(a => a.transactions);

                console.log('transactionHashesInAccount:', transactionHashesInAccount);

                var uniqueTransactionHashes = Array.from(new Set(transactionHashesInAccount));

                console.log('uniqueTransactionHashes:', uniqueTransactionHashes);

                const transactionsInThisAccount = transactions.filter(a => uniqueTransactionHashes.indexOf(a.transactionHash) > -1);

                console.log('transactionsInThisAccount:', transactionsInThisAccount);

                // Sort the transaction, the array is by-ref so it will sort the original values. Sort the unconfirmed on top.
                transactionsInThisAccount.sort((a: any, b: any) => {
                    if (a.unconfirmed === true) {
                        return -1;
                    } else {
                        if (a.blockIndex > b.blockIndex) return -1; return 0;
                    }
                });

                console.log('sortedTransactions:', transactionsInThisAccount);

                const accountHistory = transactionsInThisAccount.map(t => {
                    // const tx = t as TransactionHistory;
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

                        // if (t.entryType == 'send') {
                        //     const amount = externalOutputs.map(x => x.balance).reduce((x: any, y: any) => x + y);
                        //     tx.calculatedValue = amount;
                        //     tx.calculatedAddress = externalOutputs.map(o => o.address).join('<br>');
                        // }

                        // if (t.entryType == 'receive') {
                        //     const receivedAmount = internalOutputs.map(x => x.balance).reduce((x: any, y: any) => x + y);
                        //     tx.calculatedAddress = internalOutputs.map(o => o.address).join('<br>');
                        //     tx.calculatedValue = receivedAmount;
                        // }
                    }

                    return tx;
                });

                console.log('accountHistory:', accountHistory);

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
                            const transaction = transactionStore.get(t.transactionHash);

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

                console.log('UTXOs:', utxos);

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

                console.log('balanceConfirmed:', balanceConfirmed);
                console.log('balanceUnconfirmed:', balanceUnconfirmed);

                accountHistoryStore.set(account.identifier, {
                    history: accountHistory,
                    unspent: utxos,
                    balance: balanceConfirmed,
                    unconfirmed: balanceUnconfirmed
                });

                await accountHistoryStore.save();
            }

            console.log(accountHistoryStore);
        }

        return true;
    }
}
