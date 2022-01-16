import { Network } from './network';

export class IDENTITY implements Network {
    id: string = 'IDENTITY';
    name: string = 'Identity';
    network: number = 616;
    purpose: number = 302;
    derivationPath: string = `m/302'/616'/0'`;
    logo: '';
}
