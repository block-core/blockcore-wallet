import { Network } from './network';

export class BTC44 implements Network {
    id: string = 'BTC';
    name: string = 'Bitcoin (1addresses)';
    network: number = 0;
    purpose: number = 44;
    derivationPath: string = `m/44'/0'/0'`;
}

export class BTC49 implements Network {
    id: string = 'BTC';
    name: string = 'Bitcoin (3addresses)';
    network: number = 0;
    purpose: number = 49;
    derivationPath: string = `m/49'/0'/0'`;
}

export class BTC84 implements Network {
    id: string = 'BTC';
    name: string = 'Bitcoin (bc1addresses)';
    network: number = 0;
    purpose: number = 84;
    derivationPath: string = `m/84'/0'/0'`;
}
