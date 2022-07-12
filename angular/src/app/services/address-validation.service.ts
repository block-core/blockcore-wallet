import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Network } from 'src/shared/networks';
import { base58 } from '@scure/base';
// const { base58 } = require('@scure/base');

@Injectable({
  providedIn: 'root',
})
export class AddressValidationService {
  constructor() {}

  validate(address: string, network: Network) {
    const result = this.parse(address);

    if (result.prefix == network.pubKeyHash) {
      return true;
    } else {
      return false;
    }
  }

  parse(address: string): any {
    // First we'll do a rudimentary divide between bech32 and base58 (33-35 characters in length)
    if (address.length > 40) {
      return this.parseBech32(address);
    } else {
      return this.parseBase58(address);
    }
  }

  parseBech32(address: string) {}

  parseBase58(address: string) {
    const array = base58.decode(address);
    console.log('array[0]:', array[0]);
    // console.log('array:', array);

    // const prefix = address.substring(0, 1);
    // console.log(prefix);
    // console.log('SHOULD BE C:', base58.encode(Uint8Array.from([28])));
    // const value = base58.decode(prefix);
    // console.log(value);
    return { prefix: array[0], array };
  }
}
