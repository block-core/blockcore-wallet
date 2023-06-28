import * as secp from '@noble/secp256k1';
import { bech32 } from '@scure/base';

export class SigningUtilities {
  convertEdcsaPublicKeyToSchnorr(publicKey: Uint8Array) {
    if (publicKey.length != 33) {
      throw Error('The public key must be compressed EDCSA public key of length 33.');
    }

    const schnorrPublicKey = publicKey.slice(1);
    return schnorrPublicKey;
  }

  keyToHex(publicKey: Uint8Array) {
    return secp.etc.bytesToHex(publicKey);
  }

  getIdentifier(publicKey: Uint8Array) {
    if (publicKey.length == 33) {
      return this.keyToHex(this.convertEdcsaPublicKeyToSchnorr(publicKey));
    } else {
      return this.keyToHex(publicKey);
    }
  }

  /** Used to render the user visible version of the Nostr address (hex public key) */
  getNostrIdentifier(address: string) {
    const key = this.hexToArray(address);
    const converted = this.convertToBech32(key, 'npub');
    return converted;
  }

  hexToArray(value: string) {
    return secp.etc.hexToBytes(value);
  }

  private convertToBech32(key: Uint8Array, prefix: string) {
    const keyValue = this.ensureSchnorrPublicKey(key);
    const words = bech32.toWords(keyValue);
    const value = bech32.encode(prefix, words);

    return value;
  }

  private ensureSchnorrPublicKey(publicKey: Uint8Array) {
    if (publicKey.length == 33) {
      return publicKey.slice(1);
    }

    return publicKey;
  }
}
