import { AppState } from "../interfaces";
import { StoreBase } from "./store-base";

export class UIStore extends StoreBase<AppState> {
    constructor() {
        super('app');
    }
}
