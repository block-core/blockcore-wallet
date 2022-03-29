import { Persistence } from "../persistence";

export class StoreListBase<T> {
    protected items: Map<string, T> = new Map<string, T>();
    protected state = new Persistence();

    constructor(public stateKey: string) {
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
        return this.items.get(key);
    }

    remove(key: string) {
        this.items.delete(key);
    }

    all(): T[] {
        return Array.from(this.items.values());
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

/** Stores a single entity with support for providing a default item with override. */
export class StoreBase<T> {
    protected item: T;
    protected state = new Persistence();

    constructor(public stateKey: string) {
    }

    get() {
        return this.item;
    }

    set(item: T) {
        this.item = item;
    }

    async load() {
        this.item = await this.state.get(this.stateKey);

        if (this.item == null) {
            this.item = this.defaultItem();
        }
    }

    async save() {
        return this.state.set(this.stateKey, this.item);
    }

    async wipe() {
        await this.state.remove(this.stateKey);
    }

    defaultItem(): any {
        return undefined;
    }
}
