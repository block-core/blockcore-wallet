import { Transaction } from ".";
import { StoreBase } from "./store-base";

export class TransactionStore extends StoreBase<Transaction> {
    constructor() {
        super('transactions');
    }
}
