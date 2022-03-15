import { NetworkStatus } from "../interfaces";
import { StoreListBase } from "./store-base";

export class NetworkStatusStore extends StoreListBase<NetworkStatus> {
    constructor() {
        super('networkstatus');
    }
}
