import * as secp from '@noble/secp256k1';

export class SigningUtilities {
  convertEdcsaPublicKeyToSchnorr(publicKey: Uint8Array) {
    if (publicKey.length != 33) {
      throw Error('The public key must be compressed EDCSA public key of length 33.');
    }

    const schnorrPublicKey = publicKey.slice(1);
    return schnorrPublicKey;
  }

  schnorrPublicKeyToHex(publicKey: Uint8Array) {
    return secp.utils.bytesToHex(publicKey);
  }

  getIdentifier(publicKey: Uint8Array) {
    if (publicKey.length == 33) {
      return this.schnorrPublicKeyToHex(this.convertEdcsaPublicKeyToSchnorr(publicKey));
    } else {
      return this.schnorrPublicKeyToHex(publicKey);
    }
  }
}
