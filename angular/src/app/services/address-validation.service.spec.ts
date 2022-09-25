import { EnvironmentService } from './environment.service';
import { AddressValidationService } from './address-validation.service';
import { BTC, CITY, CRS, STRAX, IMPLX } from 'src/shared/networks';

describe('AddressValidationService', () => {
  let service: AddressValidationService;
  beforeEach(() => {
    service = new AddressValidationService(null);
  });

  it('Validate Bitcoin Bech32 address', () => {
    // expect(service.validate('bc1qa29jrfkt42d7w3zluh27x8ry0fra678928q4d5', new BTC84())).toBeTrue();
  });

  it('Validate Bitcoin Base58 address', () => {
    expect(service.validateByNetwork('1N9faSzFCHvQNdNtrqxMKzYdzE2WYNJ6DT', new BTC())).toBeTrue();

    expect(service.validate('1N9faSzFCHvQNdNtrqxMKzYdzE2WYNJ6DT').networks.find((n: { id: string; }) => n.id == 'BTC')).toBeDefined();
  });

  it('Validate City Chain Base58 address', () => {
    const network = new CITY();
    expect(service.validateByNetwork('CPuzGKnZQBkFqPWThDh6F8Qb3YgPX1DeTr', network)).toBeTrue();
    expect(service.validateByNetwork('CSHCUaVbzNEjn2svthgCfvv6uvsVgopvAZ', network)).toBeTrue();
    expect(service.validateByNetwork('CJPFKjqjNW6LU8G4eNeSQgV8FAWYSLZmHp', network)).toBeTrue();
    expect(service.validateByNetwork('CPuzGKnZQBkFqPWThDh6F8Qb3YgPX1DeTr', network)).toBeTrue();
    expect(service.validateByNetwork('city1qrtc9sq7mm7p97rs2la0muppm45vrr5d9ljq0a7', network)).toBeTrue();

    // This will produce invalid prefix.
    expect(service.validateByNetwork('CPuzGKnZQBkFqPWThDh6F8Qb3YgPX1DeT', network)).toBeFalse();

    expect(service.validateByNetwork('CPuzGKnZQBkFqPWTh', network)).toBeFalse();
    expect(service.validateByNetwork('CPuzGKnZQBkFqPWThDh6F8Qb3YgPX1DeTrss', network)).toBeFalse();
    expect(service.validateByNetwork('CPuzGKnZQBkFqPWThDh6F8Qb3YgPX1De', network)).toBeFalse();

    expect(service.validate('CPuzGKnZQBkFqPWThDh6F8Qb3YgPX1DeTr').networks.find((n: { id: string; }) => n.id == 'CITY')).toBeDefined();
  });

  it('Validate Cirrus Base58 address', () => {
    const network = new CRS();
    expect(service.validateByNetwork('CdA4YkbYvrWEQyptXdgqzR51RacpWnw5nc', network)).toBeTrue();
    expect(service.validateByNetwork('CaQpsUJHZSM8N6hZmnpT5k7vFyMeYdbW5q', network)).toBeTrue();

    expect(service.validate('CdA4YkbYvrWEQyptXdgqzR51RacpWnw5nc').networks.find((n: { id: string; }) => n.id == 'CRS')).toBeDefined();
  });

  it('Validate Stratis Base58 address', () => {
    const network = new STRAX();
    expect(service.validateByNetwork('XReyTxFTRQKomq8x74aNNHmR6ZKE3Uquwg', network)).toBeTrue();
    expect(service.validateByNetwork('XDKw31DouKqZ2LnMnm7XbgzmTQNSFxnrMM', network)).toBeTrue();
    expect(service.validateByNetwork('XXzS9SU1BukHX4FDsU7doR63Qhbk2LSsQM', network)).toBeTrue();
    expect(service.validateByNetwork('XLjEnTqaroDqWdXeBt5cPP79pvYd48y1R7', network)).toBeTrue();

    expect(service.validate('XReyTxFTRQKomq8x74aNNHmR6ZKE3Uquwg').networks.find((n: { id: string; }) => n.id == 'STRAX')).toBeDefined();
  });

  it('Validate Impleum Base58 address', () => {
    const network = new IMPLX();
    expect(service.validateByNetwork('implx1q3pk7w924s72jy8amzptnwyn0509xvy3nrn2gff', network)).toBeTrue();
    expect(service.validateByNetwork('XxKEYMx47uZY9uyam3LK3bECS9gvX9ojJF', network)).toBeTrue();
    expect(service.validateByNetwork('implx1q6r3zyaap5dmatzcddq8363cr5hd49jy4r4vxez', network)).toBeTrue();
    expect(service.validateByNetwork('Xhh9Cb3u8MHdEkTDsiMnQ1GVE654Hr56Wm', network)).toBeTrue();

    expect(service.validate('Xr9UFDUhpz3Wq8kSV3h8kAwK31fhumDWLU').networks.find((n: { id: string; }) => n.id == 'IMPLX')).toBeDefined();
  });
});
