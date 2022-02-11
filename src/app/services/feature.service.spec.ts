import { FeatureService } from "./features.service";

describe('ValueService', () => {
    let service: FeatureService;
    beforeEach(() => { service = new FeatureService(); });

    it('Validate that wallet is enabled feature', () => {
        expect(service.enabled('wallet')).toBeTrue();
    });
});