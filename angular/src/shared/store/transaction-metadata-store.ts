import { TransactionMetadata } from "..";
import { StoreListBase } from "./store-base";

export class TransactionMetadataStore extends StoreListBase<TransactionMetadata> {
    constructor() {
        super('transactionmetadata');
    }
}
