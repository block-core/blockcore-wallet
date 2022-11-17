import { SendService } from './send.service';
import Big from 'big.js';
import { CITY } from 'src/shared/networks';

describe('SendService', () => {
  let service: SendService;
  beforeEach(() => {
    service = new SendService();
  });

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
});
