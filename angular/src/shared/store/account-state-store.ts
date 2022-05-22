import { basename } from "path";
import { AccountState } from "../interfaces";
import { StoreListBase } from "./store-base";

export class AccountStateStore extends StoreListBase<AccountState> {
    constructor() {
        super('accountstate');
    }

    // override get(key: string): AccountState {
    //     const value = super.get(key);

    //     // When getting account state, we will create and persist it automatically.
    //     if (value == null) {
    //         const entry: AccountState = {
    //             id: key,
    //             balance: 0,
    //             receive: [],
    //             change: []
    //         };

    //         // Persist the entry that was missing.
    //         this.set(key, entry);

    //         return entry;

    //     } else {
    //         return value;
    //     }
    // }

    /** Returns an array of addresses in the account, including receive and change addresses. */
    getAllAddresses(accountId: string) {
        const accountState = this.get(accountId);

        if (accountState == null) {
            return [];
        }

        const allAddresses = [...accountState.receive.map(a => a.address), ...accountState.change.map(a => a.address)];
        return allAddresses;
    }

}
