/* Source based on example by Brady Joslin - https://github.com/bradyjoslin */
import { Base64 } from 'js-base64';
import { payments } from '@blockcore/blockcore-js';
import * as secp from '@noble/secp256k1';
import { ES256KSigner } from 'did-jwt';
import { HDKey } from '@scure/bip32';
import { Network } from '../../shared/networks';
import { bech32 } from '@scure/base';

const enc = new TextEncoder();
const dec = new TextDecoder();

export class CryptoUtility {
  // constructor(private cryptoService: CryptoService) {}
  constructor() {}

  getAddressByNetwork(publicKey: Buffer, network: Network, addressPurpose: number) {
    if (addressPurpose == 44) {
      const { address } = payments.p2pkh({
        pubkey: publicKey,
        network: network,
      });

      return address;
    } else if (addressPurpose == 49) {
      throw Error(`The address purpose ${addressPurpose} is currently not supported.`);

      // const { address } = payments.p2wsh({
      //     pubkey: publicKey,
      //     network: network,
      // });

      // return address;
    } else if (addressPurpose == 84) {
      const { address } = payments.p2wpkh({
        pubkey: publicKey,
        network: network,
      });

      return address;
    // } else if (addressPurpose == 19) {
    //   return this.convertToBech32(publicKey, network.bech32);
    } else if (addressPurpose == 340) {
      return this.getIdentifier(publicKey);
    }

    throw Error(`The address purpose ${addressPurpose} is currently not supported.`);
  }

  convertToBech32(key: Uint8Array, prefix: string) {
    const keyValue = this.ensureSchnorrPublicKey(key);
    const words = bech32.toWords(keyValue);
    const value = bech32.encode(prefix, words);

    return value;
  }

  convertFromBech32(address: string) {
    const decoded = bech32.decode(address);
    const key = bech32.fromWords(decoded.words);

    return key;
  }

  getIdentifier(publicKey: Uint8Array) {
    if (publicKey.length == 33) {
      return this.schnorrPublicKeyToHex(this.convertEdcsaPublicKeyToSchnorr(publicKey));
    } else {
      return this.schnorrPublicKeyToHex(publicKey);
    }
  }

  convertEdcsaPublicKeyToSchnorr(publicKey: Uint8Array) {
    if (publicKey.length != 33) {
      throw Error('The public key must be compressed EDCSA public key of length 33.');
    }

    const schnorrPublicKey = publicKey.slice(1);
    return schnorrPublicKey;
  }

  ensureSchnorrPublicKey(publicKey: Uint8Array) {
    if (publicKey.length == 33) {
      return publicKey.slice(1);
    }

    return publicKey;
  }

  /** DEPRECATED: Use arrayToHex. */
  schnorrPublicKeyToHex(publicKey: Uint8Array) {
    return secp.etc.bytesToHex(publicKey);
  }

  arrayToHex(value: Uint8Array) {
    return secp.etc.bytesToHex(value);
  }

  hexToArray(value: string) {
    return secp.etc.hexToBytes(value);
  }

  getAddressByNetworkp2wsh(node: any, network: any) {
    const { address } = payments.p2wsh({
      pubkey: node.publicKey,
      network: network,
    });

    return address;
  }

  getAddressByNetworkp2pkh(node: any, network: any) {
    const { address } = payments.p2pkh({
      pubkey: node.publicKey,
      network: network,
    });

    return address;
  }

  getAddressByNetworkp2pkhFromBuffer(publicKey: Buffer, network: any) {
    const { address } = payments.p2pkh({
      pubkey: publicKey,
      network: network,
    });

    return address;
  }

  getAddressByNetworkp2wpkh(node: any, network: any) {
    const { address } = payments.p2wpkh({
      pubkey: node.publicKey,
      network: network,
    });

    return address;
  }

  // getIdentity(keyPair: Secp256k1KeyPair) {
  //   var identity = new BlockcoreIdentity(keyPair.toKeyPair(false));
  //   return identity;
  // }

  getPasswordKey(password: string) {
    return window.crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  }

  deriveKey(passwordKey: any, salt: any, keyUsage: any) {
    // TODO: Someone with better knowledge of cryptography should review our key sizes, iterations, etc.
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 250000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      keyUsage
    );
  }

  async encryptData(secretData: string, password: string) {
    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const passwordKey = await this.getPasswordKey(password);
      const aesKey = await this.deriveKey(passwordKey, salt, ['encrypt']);
      const encryptedContent = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        aesKey,
        enc.encode(secretData)
      );

      const encryptedContentArr = new Uint8Array(encryptedContent);
      let buff = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContentArr.byteLength);
      buff.set(salt, 0);
      buff.set(iv, salt.byteLength);
      buff.set(encryptedContentArr, salt.byteLength + iv.byteLength);

      return Base64.fromUint8Array(buff);
    } catch (e) {
      console.error(e);
      return '';
    }
  }

  getSigner(node: HDKey) {
    //const signer = SS256KSigner(node.privateKey);
    const signer = ES256KSigner(node.privateKey);
    return signer;
  }

  async getKeyPairFromNode(node: HDKey) {
    const signer = ES256KSigner(node.privateKey);
    return signer;
    // let jwt = await createJWT(
    //   { aud: 'did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74', exp: 1957463421, name: 'uPort Developer' },
    //   { issuer: 'did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74', signer },
    //   { alg: 'ES256K' }
    // )

    // const tools = new BlockcoreIdentityTools();

    // let keyPair = await tools.keyPairFrom({
    //   publicKeyBase58: bs58.encode(node.publicKey),
    //   privateKeyHex: node.privateKey.toString('hex'),
    // });

    // return keyPair;
  }

  // async decryptData(encryptedData: string, password: string) {
  //   return this.cryptoService.decryptData(encryptedData, password);
  // }
}
