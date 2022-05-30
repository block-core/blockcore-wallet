import { ChangeDetectorRef, Injectable, NgZone } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { ActionStore, AddressStore, NetworkStatusStore, SettingStore, TransactionStore, UIStore, WalletStore, AccountHistoryStore, AddressIndexedStore } from "src/shared";
import { AccountStateStore } from "src/shared/store/account-state-store";
import { AddressWatchStore } from "src/shared/store/address-watch-store";
import { StoreBase, StoreListBase } from "src/shared/store/store-base";
import { LoggerService } from "./logger.service";

@Injectable({
    providedIn: 'root'
})
export class StateService {
    private stores: any = [];
    changedSubject: BehaviorSubject<StateService>;

    public get changed$(): Observable<StateService> {
        return this.changedSubject.asObservable();
    }

    constructor(
        private addressStore: AddressStore,
        private actionStore: ActionStore,
        private networkStatusStore: NetworkStatusStore,
        private settingStore: SettingStore,
        private transactionStore: TransactionStore,
        private uiStore: UIStore,
        private walletStore: WalletStore,
        private logger: LoggerService,
        private ngZone: NgZone,
        private accountHistoryStore: AccountHistoryStore,
        private addressWatchStore: AddressWatchStore,
        private addressIndexedStore: AddressIndexedStore,
        private accountStateStore: AccountStateStore,

    ) {
        this.changedSubject = new BehaviorSubject<StateService>(this);

        this.stores.push(addressStore);
        this.stores.push(actionStore);
        this.stores.push(networkStatusStore);
        this.stores.push(settingStore);
        this.stores.push(transactionStore);
        this.stores.push(uiStore);
        this.stores.push(walletStore);
        this.stores.push(accountHistoryStore);
        this.stores.push(addressWatchStore);
        this.stores.push(addressIndexedStore);
        this.stores.push(accountStateStore);
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

        this.logger.info('Stores:', this.stores);
    }

    /** Find an individual store and reload that. */
    async reloadStore(name: string) {
        const store = this.stores.find((s: { stateKey: string; }) => s.stateKey == name);

        if (store == null) {
            return;
        }

        await store.load();
        this.changedSubject.next(this);
    }

    async reload() {
        this.ngZone.run(async () => {
            this.logger.debug('RELOAD ON STATE SERVICE (in zone):');

            await this.addressStore.load();
            await this.transactionStore.load();
            await this.walletStore.load();
            await this.accountHistoryStore.load();
            await this.addressWatchStore.load();
            await this.addressIndexedStore.load();
            await this.accountStateStore.load();
    
            this.logger.debug('RELOAD CALLED:');
            this.logger.debug(this.accountHistoryStore.all());
    
            this.changedSubject.next(this);
        });
    }

    async refresh() {
        this.ngZone.run(async () => {
            this.logger.debug('REFRESH ON STATE SERVICE (in zone):');

            await this.addressStore.load();
            await this.transactionStore.load();
            await this.walletStore.load();
            await this.accountHistoryStore.load();
            await this.addressWatchStore.load();
            await this.addressIndexedStore.load();
            await this.accountStateStore.load();

            this.changedSubject.next(this);
        });
    }

    async update() {
        this.ngZone.run(async () => {
            this.logger.debug('UPDATE ON STATE SERVICE (in zone):');

            await this.walletStore.load();
            this.logger.debug('GET WALLETS:', this.walletStore.getWallets())
            this.changedSubject.next(this);
        });
    }
}
