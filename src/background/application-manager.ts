import { environment } from "../environments/environment";
import { AppState } from "./application-state";
import { CommunicationBackgroundService } from "./communication";
import { CryptoUtility } from "./crypto-utility";
import { DataSyncService } from "./data-sync";
import { NetworkLoader } from "./network-loader";
import { OrchestratorBackgroundService } from "./orchestrator";

/** Main logic that is responsible for orchestration of the background service. */
export class AppManager {
    constructor() {

    }

    private state!: AppState;

    /** Initializes the app, loads the AppState and other operations. */
    initialize(): [AppState, CryptoUtility, CommunicationBackgroundService, OrchestratorBackgroundService, DataSyncService] {
        debugger;
        const networkLoader = new NetworkLoader();
        const utility = new CryptoUtility();
        this.state = new AppState();
        const communication = new CommunicationBackgroundService();
        const orchestrator = new OrchestratorBackgroundService();
        const sync = new DataSyncService();

        this.state.networks = networkLoader.getNetworks(environment.networks);

        // Hook up dependencies, there are no IoC in our setup for background process:
        sync.configure(communication, this.state, utility);
        orchestrator.configure(communication, this.state, utility, sync);

        return [this.state, utility, communication, orchestrator, sync];
    }

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
}