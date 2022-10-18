import { BlockcoreIdentity } from './identity';
import { KeyPair } from './interfaces';
import { JsonWebKey, VerificationMethod } from 'did-resolver';
import * as secp from '@noble/secp256k1';
import { HDKey } from '@scure/bip32';
import { base64url } from '@scure/base';
import { ES256KSigner } from 'did-jwt';

export class BlockcoreIdentityTools {
  /** Get the address (identity) of this DID. Returned format is "did:is:[publicKey]". Supports using publicKeyMultibase or publicKey, which can be in format of schnorr string, or array of both Schnorr and ECDSA type. */
  // getIdentifier(options: { publicKey?: string | Uint8Array; publicKeyMultibase?: string }) {
  //   let pubkey = '';

  //   // If the buffer is not supplied, then we'll convert base58 to buffer.
  //   if (options.publicKeyMultibase) {
  //     pubkey = options.publicKeyMultibase.slice(1); // Slice off the multibase prefix, 'f'.
  //   }

  //   if (options.publicKey instanceof Uint8Array) {
  //     let buffer = null;

  //     if (options.publicKey.length == 33) {
  //       buffer = this.convertEdcsaPublicKeyToSchnorr(options.publicKey);
  //     } else {
  //       buffer = options.publicKey;
  //     }

  //     pubkey = this.schnorrPublicKeyToHex(buffer);
  //   } else {
  //     pubkey = options.publicKey;
  //   }

  //   return `${BlockcoreIdentity.PREFIX}${pubkey}`;
  // }

  private numTo32String(num: number | bigint): string {
    return num.toString(16).padStart(64, '0');
  }

  /** Creates a JsonWebKey from a public key hex. */
  getJsonWebKey(publicKeyHex: string): JsonWebKey {
    const pub = secp.Point.fromHex(publicKeyHex);
    const x = secp.utils.hexToBytes(this.numTo32String(pub.x));
    const y = secp.utils.hexToBytes(this.numTo32String(pub.y));

    return {
      kty: 'EC',
      crv: 'secp256k1',
      x: base64url.encode(x), // This version of base64url uses padding.
      y: base64url.encode(y), // Without padding: Buffer.from(bytesOfX).toString('base64url')
      // Example from did-jwt: bytesToBase64url(hexToBytes(kp.getPublic().getY().toString('hex')))
    };
  }

  getPublicKey(publicKey: Uint8Array) {
    return this.schnorrPublicKeyToHex(publicKey);
  }

  getPublicKeyFromPrivateKey(privateKey: Uint8Array) {
    return secp.schnorr.getPublicKey(privateKey);
  }

  convertEdcsaPublicKeyToSchnorr(publicKey: Uint8Array) {
    if (publicKey.length != 33) {
      throw Error('The public key must be compressed EDCSA public key of length 33.');
    }

    const schnorrPublicKey = publicKey.slice(1);
    return schnorrPublicKey;
  }

  async getSigner(node: HDKey) {
    const signer = ES256KSigner(node.privateKey);
    return signer;
  }

  schnorrPublicKeyToHex(publicKey: Uint8Array) {
    return secp.utils.bytesToHex(publicKey);
  }

  generateKey(): Uint8Array {
    return secp.utils.randomPrivateKey();
  }

  /** Generates a random private key and includes the public key and the full identifier (with did:is prefix). */
  // generateKeyPair(): KeyPair {
  //   const key = this.generateKey();
  //   const pubkey = this.getPublicKeyFromPrivateKey(key);
  //   const identifier = this.getIdentifier({ publicKey: pubkey });

  //   return {
  //     privateKey: key,
  //     publicKey: pubkey,
  //     identifier: identifier,
  //   };
  // }

  /** Get a VerificationMethod structure from a keypair instance. */
  getVerificationMethod(privateKey: Uint8Array, keyIndex: number = 1, method: string = BlockcoreIdentity.PREFIX): VerificationMethod {
    const publicKey = secp.schnorr.getPublicKey(privateKey);
    const publicKeyHex = secp.utils.bytesToHex(publicKey);
    const did = `${method}:${publicKeyHex}`;

    return {
      id: `${did}#keys-${keyIndex}`,
      // We must use this type while we wait for "did-jwt" support Schnorr:
      type: 'JsonWebKey2020', // Reference: 'SchnorrSecp256k1Signature2019' / 'EcdsaSecp256k1VerificationKey2019'
      // https://w3c.github.io/vc-jws-2020/
      // https://w3c-ccg.github.io/lds-ecdsa-secp256k1-2019/
      controller: did,
      publicKeyJwk: this.getJsonWebKey(publicKeyHex),
      // Reconsider relying on multibase if the industry prefer that.
      // publicKeyMultibase: 'f' + pubKeyHex,
    };
  }
}
