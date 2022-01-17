import { Network } from './network';

export class STRAX implements Network {
    id: string = 'STRAX';
    name: string = 'Stratis';
    network: number = 105105;
    purpose: number = 44;
    derivationPath: string = `m/44'/105105'/0'`;
}
