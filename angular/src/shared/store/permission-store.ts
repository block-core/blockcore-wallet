import { Permission, PermissionDomain } from "../interfaces";
import { StoreListBase } from "./store-base";

export class PermissionStore extends StoreListBase<PermissionDomain> {
    constructor() {
        super('permission');
    }
}
