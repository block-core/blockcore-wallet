import { Persisted } from "src/shared/interfaces";
import { State, Transaction, StateStore } from ".";

export class TransactionStore {
    items: Map<string, Transaction>;
    state = new StateStore();
    stateKey = 'transactions';

    constructor() {
    }

    async wipe(): Promise<void> {
        await this.state.remove(this.stateKey);
    }

    async save(): Promise<void> {
        return this.state.set(this.stateKey, Object.fromEntries(this.items.entries()));
        // return chrome.storage.local.set({ 'transactions': Object.fromEntries(this.items.entries()) });
    }

    async load() {
        const transactions = await this.state.get(this.stateKey);
        // const { transactions } = await chrome.storage.local.get(['transactions']);

        if (transactions != null && Object.keys(transactions).length > 0) {
            this.items = new Map<string, Transaction>(Object.entries(transactions))
        } else {
            this.items = new Map<string, Transaction>();
        }
    }
}
