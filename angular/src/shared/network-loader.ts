import { IndexerApiStatus, NetworkStatus } from './interfaces';
import { Network, BTC44, BTC84, CITY, CRS, IDENTITY, NOSTR, STRAX, TSTRAX, TCRS } from './networks';
import { Servers } from './servers';
import { NetworkStatusStore } from './store';

/** Holds a list of networks that is available. */
export class NetworkLoader {
    private networks: Network[] = [];
    // private store: NetworkStatusStore = new NetworkStatusStore();
    private loaded = false;

    constructor(private store?: NetworkStatusStore) {
        this.createNetworks();
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
        return this.networks.find(w => w.id == networkType);
    }

    getAllNetworks() {
        return this.networks;
    }

    createNetworks() {
        this.networks.push(new STRAX());
        this.networks.push(new CRS());
        this.networks.push(new TSTRAX());
        this.networks.push(new TCRS());
        this.networks.push(new CITY());
        this.networks.push(new IDENTITY());
        this.networks.push(new NOSTR());
        this.networks.push(new BTC44());
        this.networks.push(new BTC84());
    }

    private generateRandomNumber(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getServer(networkType: string, networkGroup: string, customServer?: string) {
        console.log(`getServer: ${networkType} | ${networkGroup} | ${customServer}`);

        if (networkGroup == 'custom') {
            const server = customServer.replace('{id}', networkType.toLowerCase());
            return server;
        } else {
            const serversGroup = Servers[networkGroup];
            const servers = serversGroup[networkType];

            const serverStatuses = this.store.get(networkType);
            console.log(serverStatuses);

            if (!serverStatuses) {
                console.log('NO STATUSES!!! - returning empty URL!');
                return null;
                // console.log('NO STATUSES!!! - get URL from list of servers:');
                // const serverIndex = this.generateRandomNumber(0, servers.length - 1);
                // const server = servers[serverIndex];
                // return server;
            } else {
                const availableServers = serverStatuses.filter(s => s.availability === IndexerApiStatus.Online);
                const availableServersUrl = availableServers.map(s => s.url);

                const serverIndex = this.generateRandomNumber(0, availableServersUrl.length - 1);
                const server = availableServersUrl[serverIndex];

                console.log(`server:`, server);

                return server;
            }
        }
    }

    getServers(networkType: string, networkGroup: string, customServer?: string) {
        console.log(`getServers: ${networkType} | ${networkGroup} | ${customServer}`);

        if (networkGroup == 'custom') {
            const server = customServer.replace('{id}', networkType.toLowerCase());
            return server;
        } else {
            const serversGroup = Servers[networkGroup];
            const servers = serversGroup[networkType];
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
    }
}
