import { ServiceListEntry } from '@blockcore/dns';
import { Defaults } from './defaults';
import { IndexerApiStatus, NetworkStatus } from './interfaces';
import { NameserverService } from './nameserver.service';
import { Network } from './networks';
// import { Servers } from './servers';
import { NetworkStatusStore } from './store';
import { StateStore } from './store/state-store';

/** Holds a list of networks that is available. */
export class NetworkLoader {
  private networks: Network[] = [];
  // private store: NetworkStatusStore = new NetworkStatusStore();
  private loaded = false;
  public nameserverService: NameserverService;

  constructor(public store?: NetworkStatusStore, public stateStore?: StateStore) {
    this.createNetworks();
    this.nameserverService = new NameserverService();
  }

  /** Returns a list of networks that correspond to the filter supplied. */
  getNetworks(filter: string[]) {
    // When the filter is empty, we'll return the full list.
    if (filter.length == 0) {
      return this.networks;
    }

    return this.networks.filter((network) => {
      return filter.includes(network.id);
    });
  }

  /** Get the network definition based upon the network identifier. */
  getNetwork(networkType: string) {
    return this.networks.find((w) => w.id == networkType);
  }

  getAllNetworks() {
    return this.networks;
  }

  createNetworks() {
    this.networks = Defaults.getNetworks();
  }

  private generateRandomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getServer(networkType: string, networkGroup: string, customServer?: string) {
    if (networkType === 'TBTC')
    {
      debugger;
    }


    debugger;
    console.debug(`getServer: ${networkType} | ${networkGroup} | ${customServer}`);
    const stateEntry = this.stateStore.get();

    if (!stateEntry.activeNetworks) {
      stateEntry.activeNetworks = [];
    }

    let existingState = stateEntry.activeNetworks.find((a) => a.networkType == networkType);

    if (!existingState) {
      existingState = { networkType, domain: '', url: '' };
      stateEntry.activeNetworks.push(existingState);

      // Ensure we persist after pushing to the activeNetworks collection. Don't wait around for this async method.
      this.stateStore.save();
    }

    if (networkGroup == 'custom') {
      const server = customServer.replace('{id}', networkType.toLowerCase());
      existingState.domain = server.substring(server.indexOf('//') + 2);
      existingState.url = server;
      return server;
    } else {
      // const serversGroup = Servers[networkGroup];
      // const servers = serversGroup[networkType];

      const serverStatuses = this.store.get(networkType);
      // console.log(serverStatuses);

      if (!serverStatuses) {
        existingState.domain = '';
        existingState.url = '';
        // console.warn(`No indexers for ${networkType} available. Returning empty URL!`);
        return null;
        // console.log('NO STATUSES!!! - get URL from list of servers:');
        // const serverIndex = this.generateRandomNumber(0, servers.length - 1);
        // const server = servers[serverIndex];
        // return server;
      } else {
        const availableServers = serverStatuses.filter((s) => s.availability === IndexerApiStatus.Online);

        if (availableServers.length == 0) {
          // console.warn(`No indexers for ${networkType} is online. Returning empty URL!`);
          existingState.domain = '';
          existingState.url = '';
          return null;
        }

        // Verify if the current selected indexer is still online and return it, if it is online:
        const existingServer = availableServers.find((s) => s.domain == existingState.domain);

        // If the server that is selected is online, continue to use it.
        if (existingServer) {
          return existingServer.url;
        } else {
          // If the server is not online, get another one:
          const availableServersUrl = availableServers.map((s) => s.url);
          const serverIndex = this.generateRandomNumber(0, availableServersUrl.length - 1);
          const server = availableServersUrl[serverIndex];

          // Since we only have the server URL right here and instead of querying the servers with that, we'll just grab domain from URL:
          existingState.domain = server.substring(server.indexOf('//') + 2);
          existingState.url = server;

          return server;
        }
      }
    }
  }

  getServers(networkType: string, networkGroup: string, customServer?: string): ServiceListEntry[] {
    // console.debug(`getServers: ${networkType} | ${networkGroup} | ${customServer}`);

    if (networkGroup == 'custom') {
      const server = customServer.replace('{id}', networkType.toLowerCase());

      return [{ domain: server, symbol: networkType, service: 'Indexer', ttl: 20, online: true }];
    } else {
      // loadServices has just been called so the nameserver service should have data.
      const serversGroup = this.nameserverService.getGroups();
      const servers = serversGroup.get(networkType) as ServiceListEntry[];
      // const serversGroup = Servers[networkGroup];
      // const servers = serversGroup[networkType];
      return servers;
    }
  }

  /** Update the network status. This can be done internally or externally, depending on the scenario. */
  async update(networkType: string, networkStatuses: NetworkStatus[]) {
    // If there are no block height provided, copy the latest:
    // if (!networkStatus.blockSyncHeight) {
    //     networkStatus.blockSyncHeight = this.store.get(networkStatus.networkType).blockSyncHeight;
    // }

    this.store.set(networkType, networkStatuses);

    await this.store.save();

    // This method is called by the "updateAll", and when that happens, we'll also make sure we reload the StateStore,
    // because the user might have changed their server group in settings.
    await this.stateStore.load();

    // First load the latest:
    // await this.stateStore.load();

    // const stateEntry = this.stateStore.get();

    // if (!stateEntry.activeNetworks)
    // {
    //   stateEntry.activeNetworks =
    // }

    // Whenever the network statuses are updated, we will verify if the current active indexer is still available, if not
    // we will auto-select another online indexer.
  }
}
