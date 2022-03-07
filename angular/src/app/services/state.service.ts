import { Injectable } from "@angular/core";
import { ActionStore, AddressStore, NetworkStatusStore, SettingStore, TransactionStore, UIStore, WalletStore } from "src/shared";

@Injectable({
    providedIn: 'root'
})
export class StateService {

    private stores: any = [];

    constructor(
        private addressStore: AddressStore,
        private actionStore: ActionStore,
        private networkStatusStore: NetworkStatusStore,
        private settingStore: SettingStore,
        private transactionStore: TransactionStore,
        private uiStore: UIStore,
        private walletStore: WalletStore
    ) {
        this.stores.push(addressStore);
        this.stores.push(actionStore);
        this.stores.push(networkStatusStore);
        this.stores.push(settingStore);
        this.stores.push(transactionStore);
        this.stores.push(uiStore);
        this.stores.push(walletStore);
    }

    async wipe() {
        for (let i = 0; i < this.stores.length; i++) {
            const store = this.stores[i];
            await store.wipe();
        }
    }

    async load() {
        for (let i = 0; i < this.stores.length; i++) {
            const store = this.stores[i];
            await store.load();
        }
    }
}
