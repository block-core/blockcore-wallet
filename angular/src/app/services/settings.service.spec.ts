import { IndexerApiStatus } from "../interfaces";
import { SettingsData, SettingsService } from "./settings.service";

describe('SettingsService', () => {
    let service: SettingsService;
    beforeEach(() => { service = new SettingsService(); });

    it('Validate the operation of settings service', async () => {
        expect(service.values).toBeUndefined();
        await service.load();

        service.values.theme = 'dark';
        await service.save();

        expect(service.values.theme).toBe('dark');
    });
});