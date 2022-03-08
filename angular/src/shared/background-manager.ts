import { AddressManager } from "./address-manager";
import { IndexerBackgroundService } from "./indexer";
import { NetworkLoader } from "./network-loader";
import { AddressStore, SettingStore, TransactionStore, WalletStore } from "./store";

export class BackgroundManager {
    constructor() {

    }

    async runIndexer() {
        const settingStore = new SettingStore();
        await settingStore.load();

        const walletStore = new WalletStore();
        await walletStore.load();

        const addressStore = new AddressStore();
        await addressStore.load();

        const transactionStore = new TransactionStore();
        await transactionStore.load();

        const networkLoader = new NetworkLoader();
        const addressManager = new AddressManager(networkLoader);

        // const lightWalletManager = new LightWalletManager(walletState.getWallets());
        // lightWalletManager.getWallets();

        // Get what addresses to watch from local storage.
        // globalThis.chrome.storage.local.get('')
        const indexer = new IndexerBackgroundService(settingStore, walletStore, addressStore, transactionStore, addressManager);
        await indexer.process();

        console.log('INDEXER COMPLETED RUN!');

        console.log(walletStore);
        console.log(addressStore);
        console.log(transactionStore);
    }
}