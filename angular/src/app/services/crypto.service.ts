/* Source based on example by Brady Joslin - https://github.com/bradyjoslin */

import { BehaviorSubject, delay, Observable, of } from "rxjs";
import { Injectable } from '@angular/core';
import { Base64 } from 'js-base64';

// import * as bip39 from 'bip39';
import * as bip39 from '@scure/bip39';
import { wordlist as czech } from '@scure/bip39/wordlists/czech';
import { wordlist as english } from '@scure/bip39/wordlists/english';
import { wordlist as french } from '@scure/bip39/wordlists/french';
import { wordlist as italian } from '@scure/bip39/wordlists/italian';
import { wordlist as japanese } from '@scure/bip39/wordlists/japanese';
import { wordlist as korean } from '@scure/bip39/wordlists/korean';
import { wordlist as chinese_simplified } from '@scure/bip39/wordlists/simplified-chinese';
import { wordlist as chinese_traditional } from '@scure/bip39/wordlists/traditional-chinese';
import { wordlist as spanish } from '@scure/bip39/wordlists/spanish';

const enc = new TextEncoder();
const dec = new TextDecoder();

@Injectable({
    providedIn: 'root'
})
export class CryptoService {

    wordlists: any = {};
    words: string[];

    constructor() {
        this.wordlists.chinese_simplified = chinese_simplified;
        this.wordlists.chinese_traditional = chinese_traditional;
        this.wordlists.czech = czech;
        this.wordlists.english = english;
        this.wordlists.french = french;
        this.wordlists.italian = italian;
        this.wordlists.japanese = japanese;
        this.wordlists.korean = korean;
        this.wordlists.spanish = spanish;

        this.words = this.wordlists.english;
    }

    generateMnemonic(wordlist?: string) {
        if (wordlist) {
            this.words = this.wordlists[wordlist];
            // bip39.setDefaultWordlist(wordlist);
        }

        return bip39.generateMnemonic(this.words);
        // return bip39.generateMnemonic();
    }

    setWordList(wordlist: string) {
        this.words = this.wordlists[wordlist];
    }

    validateMnemonic(mnemonic: string) {
        console.log(mnemonic);
        console.log(this.words);

        return of(bip39.validateMnemonic(mnemonic, this.words)).pipe();
    }

    languages() {
        return Object.keys(this.wordlists);
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
