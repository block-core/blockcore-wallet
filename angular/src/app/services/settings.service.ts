import { Injectable } from "@angular/core";
import { SettingStore } from "src/shared";
import { Settings } from "../../shared/interfaces";

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    constructor(private settingStore: SettingStore
    ) {

    }

    get values(): Settings {
        return this.settingStore.get();
    }

    async replace(settings: Settings) {
        this.settingStore.set(settings);
        await this.settingStore.save();
    }
}