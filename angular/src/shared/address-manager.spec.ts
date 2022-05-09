import { AddressManager } from "./address-manager";
import { NetworkLoader } from "./network-loader";

describe('AddressManager', () => {
    beforeEach(() => { });

    it('Should return random server', () => {

        const loader = new NetworkLoader();
        const manager = new AddressManager(loader);

        const servers = [
            manager.getServer('STRAX', 'group1'),
            manager.getServer('STRAX', 'group1'),
            manager.getServer('STRAX', 'group1'),
            manager.getServer('STRAX', 'group1'),
            manager.getServer('STRAX', 'group1')
        ];

        // Get unique list of servers.
        var unique = [...new Set(servers)];

        // Expect more than a si1ngle one (then random has not worked well).
        expect(unique.length > 1).toBeTrue();
    });

});