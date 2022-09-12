import { Component, OnInit } from '@angular/core';
import { Contact, NetworkLoader } from 'src/shared';
import { ContactStore } from 'src/shared/store/contacts-store';
import { UIState } from '../services';
import { ExchangeService } from '../services/exchange.service';

@Component({
  selector: 'app-exchange',
  templateUrl: './exchange.component.html',
})
export class ExchangeComponent implements OnInit {
  public contacts: Contact[];

  constructor(private networkLoader: NetworkLoader, private exchange: ExchangeService, private uiState: UIState, private contactStore: ContactStore) {
    this.uiState.title = 'Exchange';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = true;
  }

  async ngOnInit(): Promise<void> {
    this.contacts = this.contactStore.all().sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  purchase(address: string, networkType: string) {
    const network = this.networkLoader.getNetwork(networkType);
    this.exchange.purchasePopup(address, 'BTC', 'EUR', '200');
  }

  buy(address: string, networkType: string) {
    const network = this.networkLoader.getNetwork(networkType);
    this.exchange.buyPopup(address, network, 0.01);
  }

  sell(address: string, networkType: string) {
    const network = this.networkLoader.getNetwork(networkType);
    this.exchange.sellPopup(address, network, 200);
  }
}
