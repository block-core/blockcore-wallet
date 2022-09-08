import { ChangeDetectorRef, Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ActionStore, AddressStore, NetworkStatusStore, SettingStore, TransactionStore, UIStore, WalletStore, AccountHistoryStore, AddressIndexedStore } from 'src/shared';
import { AccountStateStore } from 'src/shared/store/account-state-store';
import { AddressWatchStore } from 'src/shared/store/address-watch-store';
import { ContactStore } from 'src/shared/store/contacts-store';
import { PermissionStore } from 'src/shared/store/permission-store';
import { StandardTokenStore } from 'src/shared/store/standard-token-store';
import { StateStore } from 'src/shared/store/state-store';
import { StoreBase, StoreListBase } from 'src/shared/store/store-base';
import { EnvironmentService } from './environment.service';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
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
    private permissionStore: PermissionStore,
    private stateStore: StateStore,
    private contactStore: ContactStore,
    private tokenStore: StandardTokenStore,
    private env: EnvironmentService
  ) {
    this.changedSubject = new BehaviorSubject<StateService>(this);

    if (env.instance === 'coinvault') {
      settingStore.serverGroup = 'group2';
    }

    this.stores.push(stateStore);
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
    this.stores.push(permissionStore);
    this.stores.push(contactStore);
    this.stores.push(tokenStore);
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

    // this.logger.info('Stores:', this.stores);
  }

  /** Find an individual store and reload that. */
  async reloadStore(name: string) {
    const store = this.stores.find((s: { stateKey: string }) => s.stateKey == name);

    if (store == null) {
      return;
    }

    await store.load();
    this.changedSubject.next(this);
  }

  /** RELOAD: TODO: Figure out if reload or refresh is run when data is updated across extension instances. */
  async reload() {
    this.ngZone.run(async () => {
      // this.logger.debug('RELOAD ON STATE SERVICE (in zone):');

      await this.stateStore.load();
      await this.addressStore.load();
      await this.transactionStore.load();
      await this.walletStore.load();
      await this.accountHistoryStore.load();
      await this.addressWatchStore.load();
      await this.addressIndexedStore.load();
      await this.accountStateStore.load();
      await this.permissionStore.load();

      this.logger.debug('RELOAD CALLED:');
      this.logger.debug(this.accountHistoryStore.all());

      this.changedSubject.next(this);
    });
  }

  /** REFRESH: TODO: Figure out if reload or refresh is run when data is updated across extension instances. */
  async refresh() {
    this.ngZone.run(async () => {
      // this.logger.debug('REFRESH ON STATE SERVICE (in zone):');

      await this.stateStore.load();
      await this.addressStore.load();
      await this.transactionStore.load();
      await this.walletStore.load();
      await this.accountHistoryStore.load();
      await this.addressWatchStore.load();
      await this.addressIndexedStore.load();
      await this.accountStateStore.load();
      await this.permissionStore.load();

      this.changedSubject.next(this);
    });
  }

  async update() {
    this.ngZone.run(async () => {
      // this.logger.debug('UPDATE ON STATE SERVICE (in zone):');

      await this.walletStore.load();
      // this.logger.debug('GET WALLETS:', this.walletStore.getWallets())
      this.changedSubject.next(this);
    });
  }
}
