import { EnvironmentService } from "./environment.service";
import { FeatureService } from "./features.service";

describe('FeatureService', () => {
    let service: FeatureService;
    beforeEach(() => { service = new FeatureService(new EnvironmentService()); });

    it('Validate that wallet is enabled feature', () => {
        expect(service.enabled('wallet')).toBeTrue();
    });

    it('Validate that handler (group) is an enabled feature', () => {
        expect(service.enabledGroup('handler')).toBeTrue();
    });

    it('Validate that random (group) is an disabled feature', () => {
        expect(service.enabledGroup('random')).toBeFalse();
    });

    it('Validate that "bitcoin" (part of group) is an disabled feature', () => {
        expect(service.enabledGroup('bitcoin')).toBeFalse();
    });
});