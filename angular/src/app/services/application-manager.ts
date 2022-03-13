import { Injectable } from "@angular/core";
import { MINUTE } from "../shared/constants";
import {
    SecureStateService,
    CryptoUtility, DataSyncService, IndexerService, NetworkLoader,
    CommunicationService, WalletManager, NetworkStatusService
} from "./";
import { StateService } from "./state.service";

@Injectable({
    providedIn: 'root'
})
/** Main logic that is responsible for orchestration of the app. */
export class AppManager {
    constructor(
        public sync: DataSyncService,
        public state: StateService,
        public status: NetworkStatusService,
        public walletManager: WalletManager,
        public communication: CommunicationService,
        public indexer: IndexerService,
        public networkLoader: NetworkLoader,
        public crypto: CryptoUtility,
        public secure: SecureStateService
    ) {

    }

    async initialize() {
        await this.communication.initialize();

        // Load all the stores.
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
}