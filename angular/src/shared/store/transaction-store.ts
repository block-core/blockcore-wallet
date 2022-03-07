import { Transaction } from "..";
import { StoreListBase } from "./store-base";

export class TransactionStore extends StoreListBase<Transaction> {
    constructor() {
        super('transaction');
    }
}
