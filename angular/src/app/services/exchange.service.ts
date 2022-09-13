import { Injectable } from '@angular/core';
import { Network } from 'src/shared/networks';
import { EnvironmentService } from './environment.service';

@Injectable({
  providedIn: 'root',
})
export class ExchangeService {
  constructor(private env: EnvironmentService) {}

  sellPopup(address: string, network: Network, amount: number) {
    this.popup('', 'strax:strax-btc', amount);
  }

  buyPopup(address: string, network: Network, amount: number) {
    this.popup(address, 'btc:btc-strax', amount);
  }

  popup(address: string, pair: string, amount: number) {
    const url = `https://exolix.com/exchange/${pair}?a=${amount}&ra=${address}&ref=BcG9dcJcQqLeXPf5`;
    window.open(url, 'exolixPopup', 'height=820,width=600,left=200,top=200,resizable=yes,channelmode=yes,scrollbars=yes,toolbar=yes,menubar=no,location=yes,directories=no,status=yes');
  }

  purchasePopup(address: string, crypto: string, fiat: string, amount: string) {
    const url = `https://www.coinvault.io/simplex/?crypto=${crypto}&fiat=${fiat}&amount=${amount}&wallet_address=${address}`;
    window.open(url, 'simplexPopup', 'height=800,width=600,left=200,top=200,resizable=yes,channelmode=yes,scrollbars=yes,toolbar=yes,menubar=no,location=yes,directories=no,status=yes');
  }
}
