import { Injectable } from "@angular/core";
import { Action } from "../../shared/interfaces";
import { MINUTE } from "../shared/constants";
import {
    UIState, SecureStateService,
    CryptoUtility, DataSyncService, IndexerService, NetworkLoader,
    CommunicationService, SettingsService, WalletManager, NetworkStatusService
} from "./";

@Injectable({
    providedIn: 'root'
})
/** Main logic that is responsible for orchestration of the app. */
export class AppManager {
    constructor(
        public sync: DataSyncService,
        public state: UIState,
        public status: NetworkStatusService,
        public walletManager: WalletManager,
        public communication: CommunicationService,
        public indexer: IndexerService,
        public networkLoader: NetworkLoader,
        public crypto: CryptoUtility,
        public secure: SecureStateService,
        private settings: SettingsService
    ) {

    }

    async initialize() {
        await this.communication.initialize();

        // First load the user settings.
        await this.settings.load();

        // Then load the existing state.
        await this.state.load();

        // Then load the secure state.
        await this.secure.load();

        // Reset the timer
        this.walletManager.resetTimer();

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

    // broadcastState(initial: boolean = false) {
    //     const currentState: State = {
    //         action: this.state.action,
    //         persisted: this.state.persisted,
    //         unlocked: this.walletManager.unlocked,
    //         store: this.state.store
    //     }

    //     const eventName = initial ? 'state-loaded' : 'state-changed';

    //     // Send new state to UI instances.
    //     this.communication.sendToAll(eventName, currentState);
    // }

    async clearAction() {
        this.state.action = undefined;
        await this.state.saveAction();
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

        // if (broadcast) {
        //     this.broadcastState();
        // }

        // Raise this after state has been updated, so orchestrator in UI can redirect correctly.
        // this.communication.sendToAll('action-changed', this.state.action);
    }
}