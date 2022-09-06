import { Injectable } from '@angular/core';
import { Account, AccountHistory } from '../../shared/interfaces';
import { Network } from '../../shared/networks';
import Big from 'big.js';

@Injectable({
  providedIn: 'root',
})
export class SendSidechainService {
 
  sidechainAddress: string;
  selectedSidechain: string;
  network : Network;

  reset() {
    this.sidechainAddress = null;
    this.selectedSidechain = null;
    this.network = null;
  }
}
