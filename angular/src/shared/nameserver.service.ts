import { BlockcoreDns, ServiceListEntry } from '@blockcore/dns';
import { Nameservers } from './nameservers';

export class NameserverService {
  constructor() {}

  public services: ServiceListEntry[];

  async loadServices(networkGroup: string) {
    if (networkGroup !== 'custom') {
      let dns = new BlockcoreDns();
      await dns.load(Nameservers[networkGroup]);

      this.services = dns.getServices();
      console.log('services:', this.services);
    }
  }

  getGroups() {
    const grouped = this.groupBy(this.services, (s) => s.symbol.toUpperCase());
    return grouped;
  }

  private groupBy(list: any[], keyGetter: (arg0: any) => any) {
    const map = new Map();
    list.forEach((item) => {
      const key = keyGetter(item);
      const collection = map.get(key);
      if (!collection) {
        map.set(key, [item]);
      } else {
        collection.push(item);
      }
    });
    return map;
  }
}
