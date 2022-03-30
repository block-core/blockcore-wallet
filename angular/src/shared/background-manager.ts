import { AddressManager } from "./address-manager";
import { IndexerBackgroundService } from "./indexer";
import { AccountUnspentTransactionOutput, TransactionHistory } from "./interfaces";
import { NetworkLoader } from "./network-loader";
import { AddressStore, SettingStore, TransactionStore, WalletStore, AccountHistoryStore } from "./store";
import { AddressWatchStore } from "./store/address-watch-store";

export class BackgroundManager {

    indexing = false;
    watching = false;

    constructor() {

    }

    async runWatcher() {
        // Skip watcher while indexing.
        if (this.indexing == true) {
            return false;
        }

        this.watching = true;

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

        const addressWatchStore = new AddressWatchStore();
        await addressWatchStore.load();

        const networkLoader = new NetworkLoader();
        const addressManager = new AddressManager(networkLoader);

        // Get what addresses to watch from local storage.
        // globalThis.chrome.storage.local.get('')
        const indexer = new IndexerBackgroundService(settingStore, walletStore, addressStore, transactionStore, addressManager, accountHistoryStore);
        const changes = await indexer.process(addressWatchStore);

        if (changes) {
            console.log('There was changes...');
        }

        // If there are no changes, don't re-calculate the balance.
        if (!changes) {
            return false;
        }

        // Calculate the balance of the wallets.
        indexer.calculateBalance();

        this.watching = false;

        return true;
    }

    async runIndexer() {
        // Skip if we are already indexing.
        if (this.indexing == true) {
            return false;
        }

        if (this.watching == true) {
            // Delay and try again...
            setTimeout(async () => {
                await this.runIndexer();
            }, 2000);
        }

        this.indexing = true;

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

        // Get what addresses to watch from local storage.
        // globalThis.chrome.storage.local.get('')
        const indexer = new IndexerBackgroundService(settingStore, walletStore, addressStore, transactionStore, addressManager, accountHistoryStore);
        const changes = await indexer.process(null);

        // If there are no changes, don't re-calculate the balance.
        if (!changes) {
            return false;
        }

        // Calculate the balance of the wallets.
        indexer.calculateBalance();

        this.indexing = false;

        return true;
    }
}
