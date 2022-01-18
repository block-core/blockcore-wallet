/* Source based on example by Brady Joslin - https://github.com/bradyjoslin */
import * as bip39 from 'bip39';
import { Base64 } from 'js-base64';
import { address, payments } from 'bitcoinjs-lib';
import { BlockcoreIdentity, Identity, BlockcoreIdentityTools } from '@blockcore/identity';
import * as bs58 from 'bs58';
import { keyUtils, Secp256k1KeyPair } from '@transmute/did-key-secp256k1';

const enc = new TextEncoder();
const dec = new TextDecoder();

// TODO: Refactor the node/account management to a seperate type, e.g. "AccountManager" or something. Added here to finish faster.

export class CryptoUtility {
    constructor() {
    }

    getProfileNetwork() {
        var tools = new BlockcoreIdentityTools();
        return tools.getProfileNetwork();
    }

    getAddress(node: any) {
        const { address } = payments.p2pkh({
            pubkey: node.publicKey,
            network: this.getProfileNetwork(),
        });

        return address;
    }

    getAddressByNetwork(publicKey: Buffer, network: any, addressPurpose: number) {
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
        }

        throw Error(`The address purpose ${addressPurpose} is currently not supported.`);
    }

    getAddressByNetworkp2wsh(node: any, network: any) {
        const { address } = payments.p2wsh({
            pubkey: node.publicKey,
            network: network,
        });

        return address;
    }

    FgetAddressByNetworkp2pkh(node: any, network: any) {
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

    getIdentity(keyPair: Secp256k1KeyPair) {
        var identity = new BlockcoreIdentity(keyPair.toKeyPair(false));
        return identity;
    }

    generateMnemonic() {
        return bip39.generateMnemonic();
    }

    getPasswordKey(password: string) {
        return window.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
            "deriveKey",
        ]);
    }

    deriveKey(passwordKey: any, salt: any, keyUsage: any) {
        // TODO: Someone with better knowledge of cryptography should review our key sizes, iterations, etc.
        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 250000,
                hash: "SHA-256",
            },
            passwordKey,
            { name: "AES-GCM", length: 256 },
            false,
            keyUsage
        );
    }

    async encryptData(secretData: string, password: string) {
        try {
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const passwordKey = await this.getPasswordKey(password);
            const aesKey = await this.deriveKey(passwordKey, salt, ["encrypt"]);
            const encryptedContent = await window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                },
                aesKey,
                enc.encode(secretData)
            );

            const encryptedContentArr = new Uint8Array(encryptedContent);
            let buff = new Uint8Array(
                salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
            );
            buff.set(salt, 0);
            buff.set(iv, salt.byteLength);
            buff.set(encryptedContentArr, salt.byteLength + iv.byteLength);

            return Base64.fromUint8Array(buff);
        } catch (e) {
            console.error(e);
            return "";
        }
    }

    async getKeyPairFromNode(node: any) {
        const tools = new BlockcoreIdentityTools();

        let keyPair = await tools.keyPairFrom({ publicKeyBase58: bs58.encode(node.publicKey), privateKeyHex: node.privateKey.toString('hex') });

        return keyPair;
    }

    async decryptData(encryptedData: string, password: string) {
        try {
            const encryptedDataBuff = Base64.toUint8Array(encryptedData);

            const salt = encryptedDataBuff.slice(0, 16);
            const iv = encryptedDataBuff.slice(16, 16 + 12);
            const data = encryptedDataBuff.slice(16 + 12);
            const passwordKey = await this.getPasswordKey(password.toString());
            const aesKey = await this.deriveKey(passwordKey, salt, ["decrypt"]);
            const decryptedContent = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                },
                aesKey,
                data
            );
            return dec.decode(decryptedContent);
        } catch (e) {
            console.error(e);
            return "";
        }
    }
}
