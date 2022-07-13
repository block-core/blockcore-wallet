import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NonFungibleToken } from './collectables.interfaces';
import { HttpClient } from '@angular/common/http';
import { NetworkLoader } from '../../shared/network-loader';
import { NetworksService, SettingsService } from '../services';
import { AddressManager } from '../../shared/address-manager';
import axios from 'axios';
import { Account } from '../../shared';
import { AccountStateStore } from '../../shared/store/account-state-store';

@Component({
  selector: 'app-collectable',
  templateUrl: './collectable.component.html',
})
export class CollectablesComponent implements OnInit {
  http: HttpClient;
  NonFungibleTokens: NonFungibleToken[];
  @Input() account: Account;
  @Output() totalItemsOnAccount: EventEmitter<number> = new EventEmitter<number>();
  private indexerUrl: string;

  constructor(private network: NetworksService, private settings: SettingsService, private networkLoader: NetworkLoader, private accountStateStore: AccountStateStore) {}

  async reload() {
    if (this.account !== undefined) {
      const addressManager = new AddressManager(this.networkLoader);
      const network = addressManager.getNetwork(this.account.networkType);
      this.indexerUrl = this.networkLoader.getServer(network.id, this.settings.values.server, this.settings.values.indexer);

      console.log('COLLECTIBLES INDEXER URL', this.indexerUrl);

      // If there are no indexers online, we'll try again in 30 seconds.
      if (!this.indexerUrl) {
        setTimeout(async () => {
          await this.reload();
        }, 30000);
        return;
      }

      const accountStore = this.accountStateStore.get(this.account.identifier);

      if (accountStore != null) {
        let receiveAddress = accountStore.receive[0].address;
        let queryNetwork = network.name.toLowerCase();

        const response = await axios.get(`${this.indexerUrl}/api/query/${queryNetwork}/collectables/${receiveAddress}`, {
          'axios-retry': {
            retries: 0,
          },
        });

        this.NonFungibleTokens = response.data.items;
        this.totalItemsOnAccount.emit(response.data.total);
      }
    }
  }

  async ngOnInit(): Promise<void> {
    await this.reload();
  }
}
