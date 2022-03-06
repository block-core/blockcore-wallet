import { Persisted } from ".";

export class LightWalletManager {

    constructor(private state: Persisted) {

    }

    getWallets() {
        return this.state.wallets;
    }
}
