import { AddressManager } from "./address-manager";
import { IndexerBackgroundService } from "./indexer";
import { AccountUnspentTransactionOutput, TransactionHistory } from "./interfaces";
import { NetworkLoader } from "./network-loader";
import { AddressStore, SettingStore, TransactionStore, WalletStore, AccountHistoryStore } from "./store";

export class BackgroundManager {
    constructor() {

    }

    async runWatcher() {
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
        const changes = await indexer.process();

        // If there are no changes, don't re-calculate the balance.
        if (!changes) {
            return false;
        }

        // Calculate the balance of the wallets.
        indexer.calculateBalance();

        return true;
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

        // Get what addresses to watch from local storage.
        // globalThis.chrome.storage.local.get('')
        const indexer = new IndexerBackgroundService(settingStore, walletStore, addressStore, transactionStore, addressManager, accountHistoryStore);
        const changes = await indexer.process();

        // If there are no changes, don't re-calculate the balance.
        if (!changes) {
            return false;
        }

        // Calculate the balance of the wallets.
        indexer.calculateBalance();

        return true;
    }
}
