import { NetworkLoader } from "./network-loader";

describe('AddressManager', () => {
    beforeEach(() => { });

    it('Should return random server', () => {

        const loader = new NetworkLoader();

        const servers = [
            loader.getServer('STRAX', 'group1'),
            loader.getServer('STRAX', 'group1'),
            loader.getServer('STRAX', 'group1'),
            loader.getServer('STRAX', 'group1'),
            loader.getServer('STRAX', 'group1')
        ];

        // Get unique list of servers.
        var unique = [...new Set(servers)];

        // Expect more than a si1ngle one (then random has not worked well).
        expect(unique.length > 1).toBeTrue();
    });

});