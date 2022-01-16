import { Network } from './network';

export class CRS implements Network {
    id: string = 'CRS';
    name: string = 'Cirrus';
    network: number = 401;
    purpose: number = 44;
    derivationPath: string = `m/44'/401'/0'`;
    logo: '';
}
