import { timeStamp } from "console";
import { networkInterfaces } from "os";
import { Action, NetworkStatus, Settings, State } from "../app/interfaces";
import { INDEXER_URL, MINUTE } from "../app/shared/constants";
import { environment } from "../environments/environment";
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

/** Main logic that is responsible for orchestration of the background service. */
export class AppManager {
    state!: AppState;
    walletManager!: WalletManager;
    crypto!: CryptoUtility;
    sync!: DataSyncService;
    communication!: CommunicationBackgroundService;
    orchestrator!: OrchestratorBackgroundService;
    indexer!: IndexerService;
    allNetworks: Network[];
    logger: BackgroundLoggerService;
    status: NetworkStatusManager;
    private networkStatus = new Map<string, NetworkStatus>();

    /** Initializes the app, loads the AppState and other operations. */
    // configure(): [AppState, CryptoUtility, CommunicationBackgroundService, OrchestratorBackgroundService, DataSyncService] {
    configure() {
        this.logger = new BackgroundLoggerService();
        this.crypto = new CryptoUtility();
        this.state = new AppState();
        this.communication = new CommunicationBackgroundService();
        this.sync = new DataSyncService(this);
        this.orchestrator = new OrchestratorBackgroundService(this);
        this.indexer = new IndexerService(this);

        const networkLoader = new NetworkLoader();
        this.state.networks = networkLoader.getNetworks(environment.networks);

        // Keep a local state of all networks that exists. We'll use this to allow get operations
        // that always work, even when a certain network is disabled in the UI.
        this.allNetworks = networkLoader.getAllNetworks();

        this.allNetworks.forEach(n => {
            this.networkStatus.set(n.id, <NetworkStatus>{ networkType: n.id });
        });

        this.status = new NetworkStatusManager(this);

        // setInterval(async () => {
        //     await this.refreshNetworkStatus();
        // }, 10000);

        this.refreshNetworkStatus();
    }

    /** Iterate over all active accounts and check the latest networks status. */
    async refreshNetworkStatus() {
        try {
            await this.status.updateAll(this.walletManager.activeWallet.accounts);
        }
        catch (err) {

        }

        setTimeout(async () => {
            await this.refreshNetworkStatus();
        }, 10000);
    }

    // getNetworkStatus() {
    //     this.status.getAll();
    // }

    // async updateNetworkStatus(networkStatus: NetworkStatus) {
    //     this.status.update(networkStatus);
    // }

    /** Get the network definition based upon the id, e.g. BTC, STRAX, CRS, CITY. */
    // getNetworkById(id: string) {
    //     const network = this.allNetworks.find(w => w.id == id);
    //     return network;
    // }

    /** Get the network definition based upon the network identifier. */
    getNetwork(networkType: string) {
        return this.allNetworks.find(w => w.id == networkType);
    }

    /** Get the network definition based upon the network number and purpose. The purpose defaults to 44. */
    getNetworkByPurpose(network: number, purpose: number = 44) {
        return this.allNetworks.find(w => w.network == network && w.purpose == purpose);
    }

    initialize = async () => {
        // CLEAR DATA FOR DEBUG PURPOSES:
        // chrome.storage.local.set({ 'data': null }, () => {
        // });

        // First load the existing state.
        await this.loadState();

        // Create the wallet manager, which act as root container for all the wallets and accounts.
        this.walletManager = new WalletManager(this);

        this.walletManager.resetTimer();

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

    loadState = async () => {
        // CLEAR DATA FOR DEBUG PURPOSES:
        // chrome.storage.local.set({ 'data': null }, () => {
        // });

        let { data, ui, action, store } = await this.state.load();

        // Only set if data is available, will use default if not.
        if (data) {
            this.state.persisted = data;
        }

        if (store) {
            this.state.store = store;
        }

        this.state.initialized = true;
        this.state.ui = ui ?? {};

        if (action) {
            this.state.action = action;
        }

        console.log('Load State Completed!');
        console.log(this.state);
    };

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

    async setAction(data: Action) {
        if (typeof data.action !== 'string') {
            console.error('Only objects that are string are allowed as actions.');
            return;
        }

        if (data.document != null && typeof data.document !== 'string') {
            console.error('Only objects that are string are allowed as actions.');
            return;
        }

        this.state.action = data;

        await this.state.saveAction();

        this.broadcastState();

        // Raise this after state has been updated, so orchestrator in UI can redirect correctly.
        this.communication.sendToAll('action-changed', this.state.action);
    }

    async setSettings(data: Settings) {
        this.state.persisted.settings = data;
        await this.state.save();
        this.broadcastState();
    }
}