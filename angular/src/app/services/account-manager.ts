import { Account, Wallet } from "../interfaces";
import * as bip32 from 'bip32';

/** Manager that keeps state and operations for a single account. This object does not keep the password, which must be supplied for signing operations. */
export class AccountManager {
    // addresses: AccountAddress[] = [];
    private lastUsedIndex: number = 0;

    constructor(account: Account) {
        // bip32.fromBase58(xpub).derive(0).derive(1).publicKey;
    }

    // constructor(private wallet: Wallet, private account: Account) {

    // }

    /** Get the next unused address. */
    getUnusedAddress(addressType: 'legacy' | 'segwit') {

    }

    /** Get address at the specified index and type. */
    getAddress(index: number, addressType: 'legacy' | 'segwit') {

    }

}