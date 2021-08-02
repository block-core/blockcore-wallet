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
}

interface Wallet {
    name: string | undefined;
    // network: string;
    accounts: Account[];
    mnemonic: string;
}

interface Persisted
{
    wallets: Wallet[],
    activeWalletIndex: number;
    activeAccountIndex: number,
    autoTimeout: number
}

export {
    // not exporting IWords | INumbers
    IBooleans,
    IValues,
    IStructures,
    Account,
    Wallet,
    Persisted
}