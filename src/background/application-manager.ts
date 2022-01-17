import { networkInterfaces } from "os";
import { Action, Settings, State } from "../app/interfaces";
import { environment } from "../environments/environment";
import { AppState } from "./application-state";
import { CommunicationBackgroundService } from "./communication";
import { CryptoUtility } from "./crypto-utility";
import { DataSyncService } from "./data-sync";
import { NetworkLoader } from "./network-loader";
import { OrchestratorBackgroundService } from "./orchestrator";
import { WalletManager } from "./wallet-manager";

/** Main logic that is responsible for orchestration of the background service. */
export class AppManager {
    state!: AppState;
    walletManager!: WalletManager;
    crypto!: CryptoUtility;
    sync!: DataSyncService;
    communication!: CommunicationBackgroundService;
    private orchestrator!: OrchestratorBackgroundService;

    /** Initializes the app, loads the AppState and other operations. */
    // configure(): [AppState, CryptoUtility, CommunicationBackgroundService, OrchestratorBackgroundService, DataSyncService] {
    configure() {
        debugger;

        this.crypto = new CryptoUtility();
        this.state = new AppState();
        this.communication = new CommunicationBackgroundService();
        this.sync = new DataSyncService(this);
        this.orchestrator = new OrchestratorBackgroundService(this);

        const networkLoader = new NetworkLoader();
        this.state.networks = networkLoader.getNetworks(environment.networks);

        // return [this.state, utility, communication, orchestrator, sync];
    }

    /** Get the network definition based upon the id, e.g. BTC, STRAX, CRS, CITY. */
    getNetworkById(id: string) {
        const network = this.state.networks.find(w => w.id == id);
        return network;
    }

    /** Get the network definition based upon the id, e.g. BTC, STRAX, CRS, CITY. The purpose defaults to 44. */
    getNetwork(id: number, purpose: number = 44) {
        const network = this.state.networks.find(w => w.network == id && w.purpose == purpose);
        return network;
    }

    initialize = async () => {
        debugger;
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
    };

    loadState = async () => {
        debugger;
        // CLEAR DATA FOR DEBUG PURPOSES:
        // chrome.storage.local.set({ 'data': null }, () => {
        // });

        let { data, ui, action, store } = await this.state.load();

        console.log('STORE', store);

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

    broadcastState() {
        const currentState: State = {
            action: this.state.action,
            persisted: this.state.persisted,
            unlocked: this.state.unlocked,
            store: this.state.store
        }

        // Send new state to UI instances.
        this.communication.sendToAll('state', currentState);
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