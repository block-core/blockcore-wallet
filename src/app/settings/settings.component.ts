import { Component, Inject, HostBinding } from '@angular/core';
import { UIState } from '../services/ui-state.service';
import { Location } from '@angular/common'
import { OrchestratorService } from '../services/orchestrator.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  autoTimeout!: number;

  constructor(
    public uiState: UIState,
    private manager: OrchestratorService,
    private location: Location) {
    this.autoTimeout = this.uiState.persisted.autoTimeout;
    this.uiState.title = 'Settings';
    this.uiState.showBackButton = true;
  }

  async save() {
    this.manager.setLockTimer(this.autoTimeout);
    this.location.back();
  }
}
