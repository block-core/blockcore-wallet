import { StateStore, Wallet } from ".";

export class WalletStore {
    private items: Map<string, Wallet> = new Map<string, Wallet>();
    private state = new StateStore();
    private stateKey = 'wallets';

    constructor() {
    }

    async wipe(): Promise<void> {
        await this.state.remove(this.stateKey);
    }

    async save(): Promise<void> {
        return this.state.set(this.stateKey, Object.fromEntries(this.items.entries()));
    }

    set(key: string, value: Wallet) {
        this.items.set(key, value);
    }

    get(key: string) {
        this.items.get(key);
    }

    getWallets(): Wallet[] {
        return Array.from(this.items.values());
    }

    async load() {
        const values = await this.state.get(this.stateKey);

        if (values != null && Object.keys(values).length > 0) {
            this.items = new Map<string, Wallet>(Object.entries(values))
        } else {
            this.items = new Map<string, Wallet>();
        }
    }
}
