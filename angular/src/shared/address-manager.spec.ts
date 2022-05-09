import { AddressManager } from "./address-manager";
import { NetworkLoader } from "./network-loader";

describe('AddressManager', () => {
    beforeEach(() => { });

    it('Should return random server', () => {

        const loader = new NetworkLoader();
        const manager = new AddressManager(loader);

        const server = manager.getServer('STRAX', 'group1');
        expect(server).toBeTruthy();

    });

});