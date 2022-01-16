import { Network } from './network';

export class CITY implements Network {
    id: string = 'CITY';
    name: string = 'City Chain';
    network: number = 1926;
    purpose: number = 44;
    derivationPath: string = `m/44'/1926'/0'`;
    logo: '';
}
