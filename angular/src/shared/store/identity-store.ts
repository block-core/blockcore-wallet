import { Identity } from "..";
import { StoreListBase } from "./store-base";

export class IdentityStore extends StoreListBase<Identity> {
    constructor() {
        super('identity');
    }

    getIdentities(): Identity[] {
        return Array.from(this.items.values());
    }
}
