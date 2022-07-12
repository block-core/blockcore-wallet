import { Injectable } from '@angular/core';
import { Network } from 'src/shared/networks';
import { base58, base58check } from '@scure/base';

@Injectable({
  providedIn: 'root',
})
export class AddressValidationService {
  constructor() {}

  validate(address: string, network: Network) {
    const result = this.parse(address);

    if (!result.valid) {
      return false;
    }

    if (result.prefix == network.pubKeyHash) {
      return true;
    } else {
      return false;
    }
  }

  parse(address: string): any {
    if (!address) {
      return {
        valid: false,
      };
    }

    // First we'll do a rudimentary divide between bech32 and base58 (33-35 characters in length).
    if (address.length > 35) {
      return this.parseBech32(address);
    } else if (address.length <= 35 && address.length >= 33) {
      return this.parseBase58(address);
    } else {
      return {
        valid: false,
      };
    }
  }

  parseBech32(address: string) {
    return { valid: false };
  }

  parseBase58(address: string) {
    // const array = base58check(sha256).decode(address);
    const array = base58.decode(address);
    return { prefix: array[0], array, valid: true };
  }
}
