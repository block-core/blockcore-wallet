import { AddressState } from "../interfaces";
import { StoreListBase } from "./store-base";

export class AddressStore extends StoreListBase<AddressState> {
    constructor() {
        super('address');
    }
}
