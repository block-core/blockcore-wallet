import { SendService } from "./send.service";
import Big from 'big.js';
import { CITY } from "src/shared/networks";

describe('SendService', () => {
    let service: SendService;
    beforeEach(() => { service = new SendService(); });

    it('Validate big.js usage', async () => {
        const SATOSHI_FACTOR = 100000000;

        // Example of why we added dependency on big.js for calculations:
        expect(Number(1.1) * SATOSHI_FACTOR).toBe(110000000.00000001);

        const sats = new Big('1.1').times(Math.pow(10, 8)).toNumber();
        expect(sats).toBe(110000000);

        const satsAsString = new Big(sats).toFixed(0);
        expect(satsAsString).toBe('110000000');

        expect(Big(100.1).minus(Big(0.01)).toString()).toBe('100.09');
        expect(Big(10010000000).minus(Big(1000000)).toString()).toBe('10009000000');

        var bigSatoshi = new Big(111000000);
        const bitcoin = Number(bigSatoshi.div(SATOSHI_FACTOR));
        expect(bitcoin.toPrecision()).toBe('1.11');
    });

    it('Validate SendService usage', async () => {
        const DECIMAL_POINTS = 8;

        service.network = new CITY();
        service.amount = '1.1';
        service.fee = '0.0001';
        expect(service.total.toString()).toBe('110010000');

        service.fee = '0.00000001';
        console.log('Fee:', service.fee);
        console.log(service.amount);

        service.fee = '0.00000001';
        service.amount = '92233720368'; // Int.Max which is often used as maximum on Blockcore based chains.
        expect(service.total.toString()).toBe('9223372036800000001');

        service.fee = '0.1';
        expect(service.fee.toString()).toBe('0.1');
        service.setMax(Big(20010000000));

        expect(service.amount.toString()).toBe('200'); // Amount without fee.
        expect(service.total.toString()).toBe('20010000000'); // Amount with fee.

        service.resetFee();
        expect(service.fee.toString()).toBe('0.0001');

        // Validate that we cannot use more than 8 decimals.
        try {
            service.fee = '0.000000001';
        }
        catch (ex) {
            expect(ex).toBeInstanceOf(TypeError);
        }

        // Validate that we cannot use more than 8 decimals.
        try {
            service.amount = '1.000000001';
        }
        catch (ex) {
            expect(ex).toBeInstanceOf(TypeError);
        }

        // This should work just fine.
        service.amount = '92233720368.54775807'; // long.MaxValue

        // Validate maximum value
        try {
            // This will crash and go above the limit.
            service.amount = '192233720368.54775807';
        }
        catch (ex) {
            expect(ex).toBeInstanceOf(TypeError);
        }
    });
});