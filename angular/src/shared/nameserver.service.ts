import { BlockcoreDns, ServiceListEntry } from '@blockcore/dns';
import { Nameservers } from './nameservers';

export class NameserverService {
  constructor() { }

  public services: ServiceListEntry[];

  async loadServices(networkGroup: string) {
    if (networkGroup !== 'custom') {
      let dns = new BlockcoreDns();
      await dns.load(Nameservers[networkGroup]);

      let services = dns.getServices();
      services.push({
        domain : "test.explorer.angor.io",
        online  : true,
        service : "Indexer",
        symbol : "BTC_TEST",
        ttl : 20
      });

      services.push({
        domain : "test.explorer.angor.io",
        online  : true,
        service : "Indexer",
        symbol : "TBTC",
        ttl : 20
      });

      services.push({
        domain : "explorer.angor.io",
        online  : true,
        service : "Indexer",
        symbol : "BTC",
        ttl : 20
      });

      this.services = services;

      console.log('Services:', this.services);
      debugger;
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
