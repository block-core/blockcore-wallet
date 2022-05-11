import { AddressIndexedState } from "../interfaces";
import { StoreListBase } from "./store-base";

export class AddressIndexedStore extends StoreListBase<AddressIndexedState> {
    constructor() {
        super('addressindexed');
    }
}
