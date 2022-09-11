import { Injectable } from '@angular/core';
import { Network } from 'src/shared/networks';
import { base58, base58check } from '@scure/base';
import { Defaults } from '../../shared/defaults';
import { NetworkLoader } from 'src/shared';

@Injectable({
  providedIn: 'root',
})
export class AddressValidationService {
  private networks: Network[];

  constructor(networkLoader: NetworkLoader) {
    if (!networkLoader) {
      this.networks = Defaults.getNetworks();
    } else {
      this.networks = networkLoader.getAllNetworks();
    }
  }

  validateByNetwork(address: string, network: Network) {
    const result = this.parse(address);

    if (!result.valid) {
      return false;
    }

    if (result.base58) {
      if (result.prefix == network.pubKeyHash) {
        return true;
      } else {
        return false;
      }
    } else {
      // We currently only support a unique set of bech32 prefixes, could potentially implement checks of all networks here.
      if (result.networks[0].bech32 == network.bech32) {
        return true;
      } else {
        return false;
      }
    }
  }

  validate(address: string) {
    const result = this.parse(address);

    if (!result.valid) {
      return { valid: false };
    }

    var networks = null;

    if (result.base58) {
      networks = this.networks.filter((n) => n.pubKeyHash == result.prefix);
    } else {
      networks = result.networks;
    }

    return {
      networks,
      valid: true,
    };
  }

  private parse(address: string): any {
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

  private parseBech32(address: string) {
    const networks = this.networks.filter((n) => address.startsWith(n.bech32));

    if (networks.length == 0) {
      return { valid: false, bech32: true };
    } else {
      return { valid: true, bech32: true, networks: networks };
    }
  }

  private parseBase58(address: string) {
    // const array = base58check(sha256).decode(address);
    const array = base58.decode(address);
    return { prefix: array[0], array, valid: true, base58: true };
  }
}
