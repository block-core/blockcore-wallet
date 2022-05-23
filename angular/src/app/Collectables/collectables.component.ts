import {Component, Input, OnInit} from "@angular/core";
import {NonFungibleToken} from "./Collectables.interfaces";
import {HttpClient} from "@angular/common/http";
import {NetworkLoader} from "../../shared/network-loader";
import {NetworksService, SettingsService} from "../services";
import {AddressManager} from "../../shared/address-manager";
import axios from "axios";

@Component({
  selector: 'app-collectable',
  templateUrl:'./collectable.component.html'
})
export class collectables implements OnInit{
  http:HttpClient;
  NonFungibleTokens:NonFungibleToken[];
  @Input()address:string;
  @Input()networkType:string
  private indexerUrl: string;

  constructor(
    private network: NetworksService,
    private settings: SettingsService,
    private networkLoader: NetworkLoader) {
  }


  async ngOnInit(): Promise<void> {
    if (this.address !== undefined && this.networkType !== undefined) {
      const addressManager = new AddressManager(this.networkLoader);
      const network = addressManager.getNetwork(this.networkType);
      this.indexerUrl = this.networkLoader.getServer(network.id, this.settings.values.server, this.settings.values.indexer);

      const response = await axios.get(`${(this.indexerUrl)}/api/query/cirrus/${(this.address)}/assets`, {
        'axios-retry': {
          retries: 0
        }
      });

      this.NonFungibleTokens = response.data.items;
    }
  }
}
