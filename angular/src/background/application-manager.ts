import { Injectable } from "@angular/core";
import { timeStamp } from "console";
import { networkInterfaces } from "os";
import { Action, NetworkStatus, Settings, State } from "../app/interfaces";
import { INDEXER_URL, MINUTE } from "../app/shared/constants";
import { AppState } from "./application-state";
import { CommunicationBackgroundService } from "./communication";
import { CryptoUtility } from "./crypto-utility";
import { DataSyncService } from "./data-sync";
import { IndexerService } from "./indexer";
import { BackgroundLoggerService } from "./logger";
import { NetworkLoader } from "./network-loader";
import { NetworkStatusManager } from "./network-status";
import { Network } from "./networks";
import { OrchestratorBackgroundService } from "./orchestrator";
import { WalletManager } from "./wallet-manager";

@Injectable({
    providedIn: 'root'
})
/** Main logic that is responsible for orchestration of the background service. */
export class AppManager {
    constructor(
        public sync: DataSyncService,
        public logger: BackgroundLoggerService,
        public state: AppState,
        public status: NetworkStatusManager,
        public walletManager: WalletManager,
        public communication: CommunicationBackgroundService,
        public orchestrator: OrchestratorBackgroundService,
        public indexer: IndexerService,
        public networkLoader: NetworkLoader,
        public crypto: CryptoUtility
    ) {

    }

    /** Initializes the app, loads the AppState and other operations. */
    // configure(): [AppState, CryptoUtility, CommunicationBackgroundService, OrchestratorBackgroundService, DataSyncService] {
    configure() {

    }

    initialize = async () => {
        // CLEAR DATA FOR DEBUG PURPOSES:
        // chrome.storage.local.set({ 'data': null }, () => {
        // });

        // First load the existing state.
        // await this.loadState();

        // After initialize is finished, broadcast the state to the UI.
        this.broadcastState();

        this.scheduledIndexer();

    };

    scheduledIndexer() {
        setInterval(() => {
            // We will only iterate all wallets and schedule indexing if the indexer is currently finished with all previous tasks.
            if (!this.indexer.hasWork()) {
                const wallets = this.walletManager.getWallets();

                for (let i = 0; i < wallets.length; i++) {
                    const wallet = wallets[i];

                    for (let j = 0; j < wallet.accounts.length; j++) {
                        const account = wallet.accounts[j];
                        this.indexer.process(account, wallet, false);
                    }
                }
            }
        }, MINUTE);
    }

    // loadState = async () => {
    //     // CLEAR DATA FOR DEBUG PURPOSES:
    //     // chrome.storage.local.set({ 'data': null }, () => {
    //     // });

    //     let { data, ui, action, store } = await this.state.load();

    //     // Only set if data is available, will use default if not.
    //     if (data) {
    //         this.state.persisted = data;
    //     }

    //     if (store) {
    //         this.state.store = store;
    //     }

    //     this.state.initialized = true;
    //     this.state.ui = ui ?? {};

    //     if (action) {
    //         this.state.action = action;
    //     }

    //     console.log('Load State Completed!');
    //     console.log(this.state);
    // };

    broadcastState(initial: boolean = false) {
        const currentState: State = {
            action: this.state.action,
            persisted: this.state.persisted,
            unlocked: this.walletManager.unlocked,
            store: this.state.store
        }

        const eventName = initial ? 'state-loaded' : 'state-changed';

        // Send new state to UI instances.
        this.communication.sendToAll(eventName, currentState);
    }

    async setAction(data: Action, broadcast: boolean) {
        debugger;
        if (typeof data.action !== 'string') {
            console.error('Only objects that are string are allowed as actions.');
            return;
        }

        if (data.document != null && typeof data.document !== 'string') {
            console.error('Only objects that are string are allowed as actions.');
            return;
        }

        this.state.action = data;

        console.log('SAVING ACTION....');

        await this.state.saveAction();

        if (broadcast) {
            this.broadcastState();
        }

        // Raise this after state has been updated, so orchestrator in UI can redirect correctly.
        this.communication.sendToAll('action-changed', this.state.action);
    }

    async setSettings(data: Settings) {
        this.state.persisted.settings = data;
        await this.state.save();
        this.broadcastState();
    }
}