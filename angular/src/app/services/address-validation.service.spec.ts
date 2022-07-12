import { EnvironmentService } from './environment.service';
import { AddressValidationService } from './address-validation.service';
import { BTC44, BTC84, CITY, CRS, STRAX } from 'src/shared/networks';

describe('AddressValidationService', () => {
  let service: AddressValidationService;
  beforeEach(() => {
    service = new AddressValidationService();
  });

  it('Validate Bitcoin Bech32 address', () => {
    // expect(service.validate('bc1qa29jrfkt42d7w3zluh27x8ry0fra678928q4d5', new BTC84())).toBeTrue();
  });

  it('Validate Bitcoin Base58 address', () => {
    expect(service.validate('1N9faSzFCHvQNdNtrqxMKzYdzE2WYNJ6DT', new BTC44())).toBeTrue();
  });

  it('Validate City Chain Base58 address', () => {
    const network = new CITY();
    expect(service.validate('CPuzGKnZQBkFqPWThDh6F8Qb3YgPX1DeTr', network)).toBeTrue();
    expect(service.validate('CSHCUaVbzNEjn2svthgCfvv6uvsVgopvAZ', network)).toBeTrue();
    expect(service.validate('CJPFKjqjNW6LU8G4eNeSQgV8FAWYSLZmHp', network)).toBeTrue();
    expect(service.validate('CPuzGKnZQBkFqPWThDh6F8Qb3YgPX1DeTr', network)).toBeTrue();

    // This will produce invalid prefix.
    expect(service.validate('CPuzGKnZQBkFqPWThDh6F8Qb3YgPX1DeT', network)).toBeFalse();

    expect(service.validate('CPuzGKnZQBkFqPWTh', network)).toBeFalse();
    expect(service.validate('CPuzGKnZQBkFqPWThDh6F8Qb3YgPX1DeTrss', network)).toBeFalse();
    expect(service.validate('CPuzGKnZQBkFqPWThDh6F8Qb3YgPX1De', network)).toBeFalse();
  });

  it('Validate Cirrus Base58 address', () => {
    const network = new CRS();
    expect(service.validate('CdA4YkbYvrWEQyptXdgqzR51RacpWnw5nc', network)).toBeTrue();
    expect(service.validate('CaQpsUJHZSM8N6hZmnpT5k7vFyMeYdbW5q', network)).toBeTrue();
  });

  it('Validate Stratis Base58 address', () => {
    const network = new STRAX();
    expect(service.validate('XReyTxFTRQKomq8x74aNNHmR6ZKE3Uquwg', network)).toBeTrue();
    expect(service.validate('XDKw31DouKqZ2LnMnm7XbgzmTQNSFxnrMM', network)).toBeTrue();
    expect(service.validate('XXzS9SU1BukHX4FDsU7doR63Qhbk2LSsQM', network)).toBeTrue();
    expect(service.validate('XLjEnTqaroDqWdXeBt5cPP79pvYd48y1R7', network)).toBeTrue();
  });
});
