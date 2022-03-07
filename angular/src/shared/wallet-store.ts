import { Wallet } from ".";
import { StoreBase } from "./store-base";

export class WalletStore extends StoreBase<Wallet> {
    constructor() {
        super('wallets');
    }

    getWallets(): Wallet[] {
        return Array.from(this.items.values());
    }
}
