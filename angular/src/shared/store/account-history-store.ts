import { AccountHistory } from "../interfaces";
import { StoreListBase } from "./store-base";

export class AccountHistoryStore extends StoreListBase<AccountHistory> {
    constructor() {
        super('accounthistory');
    }
}
