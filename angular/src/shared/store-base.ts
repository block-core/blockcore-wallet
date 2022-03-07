import { StateStore } from "./state-store";

export class StoreBase<T> {
    protected items: Map<string, T> = new Map<string, T>();
    protected state = new StateStore();

    constructor(private stateKey: string) {
    }

    async wipe(): Promise<void> {
        await this.state.remove(this.stateKey);
    }

    async save(): Promise<void> {
        return this.state.set(this.stateKey, Object.fromEntries(this.items.entries()));
    }

    set(key: string, value: T) {
        this.items.set(key, value);
    }

    get(key: string) {
        this.items.get(key);
    }

    async load() {
        const values = await this.state.get(this.stateKey);

        if (values != null && Object.keys(values).length > 0) {
            this.items = new Map<string, T>(Object.entries(values))
        } else {
            this.items = new Map<string, T>();
        }
    }
}
