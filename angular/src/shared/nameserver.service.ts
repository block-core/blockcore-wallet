import { BlockcoreDns, ServiceListEntry } from '@blockcore/dns';
import { Nameservers } from './nameservers';

export class NameserverService {
  constructor() {}

  public services: ServiceListEntry[];

  async loadServers(networkGroup: string) {
    if (networkGroup !== 'custom') {
      let dns = new BlockcoreDns();
      await dns.load(Nameservers[networkGroup]);

      this.services = dns.getServices();
      console.log('services:', this.services);
    }
  }
}
