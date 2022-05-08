import { AddressWatchState } from "../interfaces";
import { StoreListBase } from "./store-base";

export class AddressWatchStore extends StoreListBase<AddressWatchState> {
    constructor() {
        super('addresswatch');
    }

    byAccountId(accountId: string): AddressWatchState[] {
        const items = Array.from(this.items.values());
        return items.filter(i => i.accountId === accountId);
    }
}
