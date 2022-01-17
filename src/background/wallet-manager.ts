import { Account, Wallet } from "../app/interfaces";
import * as bip32 from 'bip32';

/** Manager that keeps state and operations for a single wallet. This object does not keep the password, which must be supplied for signing operations. */
export class WalletManager {
    // addresses: AccountAddress[] = [];
    private lastUsedIndex: number = 0;


    constructor(private wallets: Wallet[]) {
        // bip32.fromBase58(xpub).derive(0).derive(1).publicKey;

    }

    getWallets() {
        return this.wallets;
    }

}