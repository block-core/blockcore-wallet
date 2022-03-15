import { AddressWatchState } from "../interfaces";
import { StoreListBase } from "./store-base";

export class AddressWatchStore extends StoreListBase<AddressWatchState> {
    constructor() {
        super('addresswatch');
    }
}
