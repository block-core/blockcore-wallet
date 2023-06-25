import { Component, OnInit } from '@angular/core';
import { AccountStateStore, Contact, NetworkLoader } from 'src/shared';
import { ContactStore } from 'src/shared/store/contacts-store';
import { UIState, WalletManager } from '../services';
import { ExchangeService } from '../services/exchange.service';

@Component({
  selector: 'app-exchange',
  templateUrl: './exchange.component.html',
})
export class ExchangeComponent implements OnInit {
  public contacts: Contact[];

  constructor(private walletManager: WalletManager, private accountStateStore: AccountStateStore, private networkLoader: NetworkLoader, private exchange: ExchangeService, private uiState: UIState, private contactStore: ContactStore) {
    this.uiState.title = 'Exchange';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = true;
  }

  async ngOnInit(): Promise<void> {
    this.contacts = this.contactStore.all().sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  purchase(address: string, networkType: string) {
    const network = this.networkLoader.getNetwork(networkType);

    if (!address) {
      // Find account of the network type, if exists:
      let account = this.walletManager.activeWallet.accounts.find((a) => a.networkType == networkType);

      if (account) {
        const accountState = this.accountStateStore.get(account.identifier);
        address = accountState.receive[accountState.receive.length - 1].address;
      }
    }

    this.exchange.purchasePopup(address, network.symbol, 'USD', '200');
  }

  buy(address: string, networkType: string) {
    const network = this.networkLoader.getNetwork(networkType);
    this.exchange.buyPopup(address, network, 0.01);
  }

  sell(address: string, networkType: string) {
    const network = this.networkLoader.getNetwork(networkType);
    this.exchange.sellPopup(address, network, 200);
  }

  buyChangeNOW(address: string, networkType: string) {
    const network = this.networkLoader.getNetwork(networkType);
    this.exchange.popupChangeNOW(address, 'btc', network.symbol, 0.01);
  }

  sellChangeNOW(address: string, networkType: string) {
    const network = this.networkLoader.getNetwork(networkType);
    this.exchange.popupChangeNOW(address, network.symbol, 'btc', 200);
  }
}
