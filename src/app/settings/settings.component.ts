import { Component, Renderer2 } from '@angular/core';
import { UIState } from '../services/ui-state.service';
import { Location } from '@angular/common'
import { OrchestratorService } from '../services/orchestrator.service';
import { Settings } from '../interfaces';
import { OverlayContainer } from '@angular/cdk/overlay';

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
    private renderer: Renderer2,
    public uiState: UIState,
    private manager: OrchestratorService,
    private location: Location) {

    // Clone the settings on load:
    this.settings = JSON.parse(JSON.stringify(this.uiState.persisted.settings));
    this.uiState.title = 'Settings';
    this.uiState.showBackButton = true;
  }

  async save() {
    // this.manager.setLockTimer(this.autoTimeout);
    this.manager.setSettings(this.settings);
    this.location.back();
  }

  onThemeChanged(event: any) {
    if (this.settings.theme === 'light') {
      this.renderer.removeClass(document.body, 'dark-theme');
    } else {
      this.renderer.addClass(document.body, 'dark-theme');
    }
  }

  onAccentChanged(event: any) {
    console.log(this.settings);
  }
}
