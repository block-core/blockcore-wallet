import { Wallet } from "..";
import { StoreListBase } from "./store-base";

export class WalletStore extends StoreListBase<Wallet> {
    constructor() {
        super('wallet');
    }

    getWallets(): Wallet[] {
        return Array.from(this.items.values());
    }
}
