import { AddressManager } from "./address-manager";
import { IndexerBackgroundService } from "./indexer";
import { NetworkLoader } from "./network-loader";
import { AddressStore, SettingStore, TransactionStore, WalletStore, AccountHistoryStore } from "./store";
import { AccountStateStore } from "./store/account-state-store";
import { AddressIndexedStore } from "./store/address-indexed-store";
import { AddressWatchStore } from "./store/address-watch-store";
import { RunState } from "./task-runner";

export interface ProcessResult {
    changes?: boolean;
    completed?: boolean;
    cancelled?: boolean;
    failed?: boolean;
}

export class BackgroundManager {
    watcherState: RunState;
    onUpdates: Function;
    onStopped: Function;

    constructor() {

    }

    stop() {
        if (this.watcherState) {
            this.watcherState.cancel = true;
        }

        if (this.intervalRef) {
            globalThis.clearTimeout(this.intervalRef);
            this.intervalRef = null;
        }

        // We can call onStopped immediately here, since the next interval will
        // either not happen or it will simply exit without updating state.
        if (this.onStopped) {
            this.onStopped.call(null);
        }
    }

    intervalRef: any;

    async runWatcher(runState: RunState) {
        this.watcherState = runState;

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

        const accountStateStore = new AccountStateStore();
        await accountStateStore.load();

        const networkLoader = new NetworkLoader();
        const addressManager = new AddressManager(networkLoader);
        const indexer = new IndexerBackgroundService(settingStore, walletStore, addressStore, addressIndexedStore, transactionStore, addressManager, accountStateStore, accountHistoryStore);
        indexer.runState = this.watcherState;

        const executionState = {
            executions: 0,
            wait: 4
        };

        var interval = async () => {
            executionState.executions++;

            // If the interval is triggered and state is set to cancel, simply ignore processing.
            if (this.watcherState.cancel) {
                return;
            }

            const processResult = await indexer.process(addressWatchStore);

            // If the process was cancelled mid-process, return immeidately.
            if (processResult.cancelled) {
                return;
            }

            if (processResult.changes) {
                console.log('RECALCULATING BALANCE FOR WATCHER!');
                // Calculate the balance of the wallets.
                await indexer.calculateBalance();
            }

            if (this.onUpdates) {
                console.log('CALLING ON UPDATED WITH', processResult);
                this.onUpdates.call(null, processResult);
            }

            // Schedule next execution.
            executionState.wait = 2 ** executionState.executions * executionState.wait;

            if (executionState.wait > 30000) {
                executionState.wait = 30000;
            }

            // Continue running the watcher if it has not been cancelled.
            console.log('Schedule Watcher: ', executionState);
            this.intervalRef = globalThis.setTimeout(interval, executionState.wait);
        }

        this.intervalRef = globalThis.setTimeout(async () => {
            await interval();
        }, 0);
    }

    async runIndexer() {
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

        const accountStateStore = new AccountStateStore();
        await accountStateStore.load();

        const networkLoader = new NetworkLoader();
        const addressManager = new AddressManager(networkLoader);

        // Get what addresses to watch from local storage.
        // globalThis.chrome.storage.local.get('')
        const indexer = new IndexerBackgroundService(settingStore, walletStore, addressStore, addressIndexedStore, transactionStore, addressManager, accountStateStore, accountHistoryStore);
        indexer.runState = {};

        let processResult: ProcessResult = { completed: false };

        while (!processResult.completed) {
            try {
                processResult = await indexer.process(null);
            } catch (err) {
                console.error('Failure during indexer processing.', err);
                throw err;
            }

            // If there are no changes, don't re-calculate the balance.
            if (!processResult.changes) {
                console.log('If there are no changes, don\'t re-calculate the balance.');
            }

            try {
                // Calculate the balance of the wallets.
                await indexer.calculateBalance();
            } catch (err) {
                console.error('Failure during calculate balance.', err);
            }

            if (this.onUpdates) {
                this.onUpdates.call(null, processResult);
            }
        }
    }
}
