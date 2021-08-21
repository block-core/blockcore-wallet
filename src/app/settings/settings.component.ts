import { Component, Inject, HostBinding } from '@angular/core';
import { UIState } from '../services/ui-state.service';
import { Location } from '@angular/common'
import { OrchestratorService } from '../services/orchestrator.service';
import { Settings } from '../interfaces';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  settings: Settings;

  constructor(
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
}
