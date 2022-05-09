import { AUTO_TIMEOUT, INDEXER_URL, VAULT_URL } from "../../app/shared/constants";
import { Settings } from "../interfaces";
import { StoreBase } from "./store-base";

export class SettingStore extends StoreBase<Settings> {
    constructor() {
        super('setting');
    }

    override defaultItem() {
        return {
            autoTimeout: AUTO_TIMEOUT,
            indexer: INDEXER_URL,
            dataVault: VAULT_URL,
            server: 'group1',
            theme: 'dark',
            themeColor: 'primary',
            language: 'en',
            amountFormat: 'bitcoin',
            developer: false
        };
    }
}
