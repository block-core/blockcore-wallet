import { Persisted } from "src/shared/interfaces";

export class WalletState {
    async wipe(): Promise<void> {
        await chrome.storage.local.clear();
        await (<any>chrome.storage).session.clear();
    }

    async save(persisted: Persisted): Promise<void> {
        return chrome.storage.local.set({ 'data': persisted });
    }

    /** Loads all the persisted state into the extension. This might become bloated on large wallets. */
    async load() {
        const { data } = await chrome.storage.local.get(['data']);
        return data;
    }
}
