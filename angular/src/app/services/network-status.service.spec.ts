// import { IndexerApiStatus } from "../interfaces";
// import { NetworkStatusService } from "./network-status.service";

// describe('NetworkStatusService', () => {
//     let service: NetworkStatusService;
//     beforeEach(() => { service = new NetworkStatusService(); });

//     it('Validate the collection of network status entries', () => {

//         service.set({ availability: IndexerApiStatus.Online, networkType: 'CITY', status: 'Online' });
//         service.set({ availability: IndexerApiStatus.Offline, networkType: 'BTC', status: 'Offline' });

//         expect(service.get('BTC').availability).toBe(IndexerApiStatus.Offline);
//         expect(service.get('CITY').status).toBe('Online');
//     });
// });