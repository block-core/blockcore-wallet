// interfaces.ts
interface IWords {
    [key: string]: string;
}

interface INumbers {
    [key: string]: number;
}

interface IBooleans {
    [key: string]: boolean;
}

interface IValues {
    [key: string]: string | number;
}

interface IStructures {
    [key: string]: INumbers | IBooleans | IValues;
}

interface Account {
    name: string | undefined;
    network: number;
    index: number;
    purpose: number;
    derivationPath: string;
    icon?: string;
}

interface Wallet {
    id: string;
    name: string;
    // network: string;
    accounts: Account[];
    mnemonic: string;
    activeAccountIndex: number;
}

interface Persisted {
    // wallets: Map<string, Wallet>
    wallets: Wallet[]
    activeWalletId: string | undefined | null
    autoTimeout: number
    // wallets: Wallet[],
    // activeWalletIndex: number;
    // activeAccountIndex: number
}

interface Action
{
    action?: string;
    document?: string;
    tabId?: string;
}

interface State {
    action?: Action
    persisted: Persisted
    unlocked: string[]
}

export {
    // not exporting IWords | INumbers
    IBooleans,
    IValues,
    IStructures,
    Account,
    Wallet,
    Persisted,
    State,
    Action
}