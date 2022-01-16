import { Network } from './network';

export class NOSTR implements Network {
    id: string = 'NOSTR';
    name: string = 'Nostr';
    network: number = 1237;
    purpose: number = 44;
    derivationPath: string = `m/44'/1237'/0'`;
    logo: '';
}
