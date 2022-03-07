import { Wallet } from ".";

export class LightWalletManager {

    constructor(private wallets: Wallet[]) {

    }

    getWallets() {
        return this.wallets;
    }
}
