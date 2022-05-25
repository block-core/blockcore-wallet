import {Component, Input, OnInit} from "@angular/core";
import {NonFungibleToken} from "./Collectables.interfaces";
import {HttpClient} from "@angular/common/http";
import {NetworkLoader} from "../../shared/network-loader";
import {NetworksService, SettingsService} from "../services";
import {AddressManager} from "../../shared/address-manager";
import axios from "axios";
import {Account} from "../../shared";
import {AccountStateStore} from "../../shared/store/account-state-store";

@Component({
  selector: 'app-collectable',
  templateUrl:'./collectable.component.html'
})
export class collectables implements OnInit{
  http:HttpClient;
  NonFungibleTokens:NonFungibleToken[];
  @Input() account:Account;
  private indexerUrl: string;

  constructor(
    private network: NetworksService,
    private settings: SettingsService,
    private networkLoader: NetworkLoader,
    private accountStateStore: AccountStateStore) {
  }


  async ngOnInit(): Promise<void> {
    if (this.account !== undefined) {
      const addressManager = new AddressManager(this.networkLoader);
      const network = addressManager.getNetwork(this.account.networkType);
      this.indexerUrl = this.networkLoader.getServer(network.id, this.settings.values.server, this.settings.values.indexer);

      const accountStore = this.accountStateStore.get(this.account.identifier);
      if (accountStore != null)
      {
        let receiveAddress = accountStore.receive[0].address;
        let queryNetwork = network.name.toLowerCase();

        const response = await axios.get(`${(this.indexerUrl)}/api/query/${(queryNetwork)}/${(receiveAddress)}/assets`, {
          'axios-retry': {
            retries: 0
          }
        });

        this.NonFungibleTokens = response.data.items;
      }

    }
  }
}
