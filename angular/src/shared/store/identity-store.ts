import { DecentralizedIdentity } from "..";
import { StoreListBase } from "./store-base";

export class IdentityStore extends StoreListBase<DecentralizedIdentity> {
    constructor() {
        super('identity');
    }

    getIdentities(): DecentralizedIdentity[] {
        return Array.from(this.items.values());
    }
}
