import { EnvironmentService } from './environment.service';
import { AddressValidationService } from './address-validation.service';
import { BTC, CITY } from 'src/shared/networks';

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
});
