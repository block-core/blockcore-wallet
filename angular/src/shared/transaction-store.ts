import { Transaction, StateStore } from ".";

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
    }

    async load() {
        const values = await this.state.get(this.stateKey);

        if (values != null && Object.keys(values).length > 0) {
            this.items = new Map<string, Transaction>(Object.entries(values))
        } else {
            this.items = new Map<string, Transaction>();
        }
    }
}
