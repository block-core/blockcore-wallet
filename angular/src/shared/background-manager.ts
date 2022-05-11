import { AddressManager } from "./address-manager";
import { IndexerBackgroundService } from "./indexer";
import { NetworkLoader } from "./network-loader";
import { AddressStore, SettingStore, TransactionStore, WalletStore, AccountHistoryStore } from "./store";
import { AddressIndexedStore } from "./store/address-indexed-store";
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

        const addressIndexedStore = new AddressIndexedStore();
        await addressIndexedStore.load();

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
        const indexer = new IndexerBackgroundService(settingStore, walletStore, addressStore, addressIndexedStore, transactionStore, addressManager, accountHistoryStore);
        const processResult = await indexer.process(addressWatchStore);

        if (processResult.changes) {
            console.log('There was changes...');
        }

        // If there are no changes, don't re-calculate the balance.
        if (!processResult.changes) {
            this.watching = false;
            return false;
        }

        // Calculate the balance of the wallets.
        indexer.calculateBalance();

        this.watching = false;

        return true;
    }

    async runIndexer(): Promise<{ changes: boolean, completed: boolean }> {
        // Skip if we are already indexing.
        if (this.indexing == true) {
            return { changes: false, completed: true };
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

        const addressIndexedStore = new AddressIndexedStore();
        await addressIndexedStore.load();

        const transactionStore = new TransactionStore();
        await transactionStore.load();

        const accountHistoryStore = new AccountHistoryStore();
        await accountHistoryStore.load();

        const networkLoader = new NetworkLoader();
        const addressManager = new AddressManager(networkLoader);

        // Get what addresses to watch from local storage.
        // globalThis.chrome.storage.local.get('')
        const indexer = new IndexerBackgroundService(settingStore, walletStore, addressStore, addressIndexedStore, transactionStore, addressManager, accountHistoryStore);

        let processResult = null;

        try {
            processResult = await indexer.process(null);
        }
        catch (err) {
            console.error('Failure during indexer processing.', err);
        }

        // If there are no changes, don't re-calculate the balance.
        if (!processResult.changes) {
            console.log('If there are no changes, don\'t re-calculate the balance.');
            this.indexing = false;
            return processResult;
        }

        try {
            // Calculate the balance of the wallets.
            await indexer.calculateBalance();
        }
        catch (err) {
            console.error('Failure during calculate balance.', err);
        }

        this.indexing = false;
        return processResult;
    }
}
