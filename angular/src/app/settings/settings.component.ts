import { Component, Renderer2 } from '@angular/core';
import { UIState } from '../services/ui-state.service';
import { Location } from '@angular/common'
import { OrchestratorService } from '../services/orchestrator.service';
import { Settings } from '../interfaces';
import { OverlayContainer } from '@angular/cdk/overlay';
import { INDEXER_URL } from '../shared/constants';
import { TranslateService } from '@ngx-translate/core';
import { FeatureService } from '../services/features.service';
import { EnvironmentService } from '../services/environment.service';
import { AppManager } from '../../background/application-manager';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
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
    private manager: OrchestratorService,
    private appManager: AppManager,
    private settingsService: SettingsService,
    private location: Location) {

    // Reset to default if missing.
    if (!this.settingsService.values.indexer) {
      this.settingsService.values.indexer = INDEXER_URL;
    }

    // Clone the settings on load:
    this.settings = JSON.parse(JSON.stringify(settingsService.values));
    this.uiState.title = 'Settings';
    this.uiState.showBackButton = true;
  }

  async save() {
    await this.settingsService.replace(this.settings);

    this.location.back();
  }

  onThemeChanged(event: any) {
    if (this.settings.theme === 'light') {
      this.renderer.removeClass(document.body, 'dark-theme');
    } else {
      this.renderer.addClass(document.body, 'dark-theme');
    }
  }

  onLanguageChanged(event: any) {
    this.translate.use(this.settings.language)

    // if (this.settings.theme === 'light') {
    //   this.renderer.removeClass(document.body, 'dark-theme');
    // } else {
    //   this.renderer.addClass(document.body, 'dark-theme');
    // }
  }

  onAccentChanged(event: any) {
    console.log(this.settings);
  }
}
