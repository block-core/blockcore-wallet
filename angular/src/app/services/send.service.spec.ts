import { SendService } from "./send.service";
import Big from 'big.js';

describe('SendService', () => {
    let service: SendService;
    beforeEach(() => { service = new SendService(); });

    it('Validate calculations', async () => {
        const SATOSHI_FACTOR = 100000000;
        // Example of why we added dependency on big.js for calculations:
        expect(Number(1.1) * SATOSHI_FACTOR).toBe(110000000.00000001);

        const sats = new Big("1.1").times(Math.pow(10, 8)).toNumber();
        expect(sats).toBe(110000000);

        const satsAsString = new Big(sats).toFixed(0);
        expect(satsAsString).toBe('110000000');

        // service.fee = "0.0010000";
        // service.amount = "1.1";
        // console.log(service.amountAsSatoshi);

    });
});