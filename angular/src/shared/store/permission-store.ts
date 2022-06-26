import { Permission } from "../interfaces";
import { StoreListBase } from "./store-base";

export class PermissionStore extends StoreListBase<Permission> {
    constructor() {
        super('permission');
    }
}
