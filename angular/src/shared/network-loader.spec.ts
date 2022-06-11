import { NetworkLoader } from "./network-loader";
import { Servers } from "./servers";
const axios = require('axios');

describe('NetworkLoader', () => {
    beforeEach(() => { });

    // it('Should return random server', () => {

    //     const loader = new NetworkLoader();

    //     const servers = [
    //         loader.getServer('STRAX', 'group1'),
    //         loader.getServer('STRAX', 'group1'),
    //         loader.getServer('STRAX', 'group1'),
    //         loader.getServer('STRAX', 'group1'),
    //         loader.getServer('STRAX', 'group1')
    //     ];

    //     // Get unique list of servers.
    //     var unique = [...new Set(servers)];

    //     // Expect more than a si1ngle one (then random has not worked well).
    //     expect(unique.length > 1).toBeTrue();
    // });

    it('All indexers in group1 should respond', async () => {
        const servers = Servers.group1;
        const entries = Object.values(servers);

        for (var i = 0; i < entries.length; i++) {
            const entry = entries[i] as any;

            for (var j = 0; j < entry.length; j++) {
                const server = entry[j];

                try {
                    var result = await axios.get(server + '/api/stats');
                    expect(result.status).toBe(200);
                } catch (error) {
                    throw new Error('Failed to verify indexer: ' + server);
                }
            }
        }
    });

});