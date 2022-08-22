import { Component, Renderer2 } from '@angular/core';
import { UIState, FeatureService, EnvironmentService, SettingsService, WalletManager, CommunicationService, LoggerService } from '../services';
import { Location } from '@angular/common';
import { Settings } from '../../shared/interfaces';
import { INDEXER_URL } from '../shared/constants';
import { TranslateService } from '@ngx-translate/core';
import { SettingStore } from '../../shared';
import { RuntimeService } from '../../shared/runtime.service';
import { StateStore } from 'src/shared/store/state-store';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  settings: Settings;
  theme: string = 'dark';
  themeColor: 'primary' | 'accent' | 'warn' = 'accent';
  isDark = false;

  constructor(
    public uiState: UIState,
    public translate: TranslateService,
    public feature: FeatureService,
    public env: EnvironmentService,
    private renderer: Renderer2,
    private stateStore: StateStore,
    private logger: LoggerService,
    private walletManager: WalletManager,
    private communication: CommunicationService,
    private settingsService: SettingsService,
    private settingStore: SettingStore,
    private runtime: RuntimeService,
    private location: Location
  ) {
    // The Settings UI can be opened from the "Extension options" link and then settings won't be loaded yet.
    if (!settingsService.values) {
      if (env.instance === 'coinvault') {
        this.settingStore.serverGroup = 'group2';
      }
      this.settings = JSON.parse(JSON.stringify(this.settingStore.defaultItem()));
    } else {
      // Clone the settings on load:
      this.settings = JSON.parse(JSON.stringify(settingsService.values));
    }

    // Reset to default if missing.
    if (!this.settings.indexer) {
      this.settings.indexer = INDEXER_URL;
    }

    this.uiState.title = 'Settings';
    this.uiState.showBackButton = true;

    this.logger.debug('Settings:', this.settings);
  }

  updateAllInstances() {
    if (this.runtime.isExtension) {
      // chrome.runtime.sendMessage({
      //   type: 'store-reload',
      //   data: 'setting',
      //   ext: 'blockcore',
      //   source: 'tab',
      //   target: 'tabs',
      //   host: location.host
      // }, function (response) {
      //   // console.log('Extension:sendMessage:response:updated:', response);
      // });
    }
  }

  async save() {
    this.logger.debug('SAVING', this.settings);

    await this.settingsService.replace(this.settings);

    await this.walletManager.resetTimer();

    this.logger.debug('Theme is now after save in replace: ', this.settingsService.values.theme);

    // this.communication.send(this.communication.createMessage('settings:saved', this.settingsService.values));

    // Whenever settings are saved, we must make sure we wipe the StateStore, which keeps the active indexer, since user
    // might have changed that in their settings.
    await this.stateStore.wipe();
    await this.stateStore.load(); // Also load after wipe, so the default object is added.

    this.updateAllInstances();

    this.location.back();
  }

  onThemeChanged(event: any) {
    this.settingsService.setTheme(this.settings.theme);
  }

  onLanguageChanged(event: any) {
    this.settingsService.setLanguage(this.settings.language);
  }

  onAccentChanged(event: any) {
    this.logger.debug(this.settings);
  }
}
