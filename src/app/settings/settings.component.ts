import { Component, Inject, HostBinding } from '@angular/core';
import { ApplicationState } from '../services/application-state.service';
import { Location } from '@angular/common'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  constructor(public appState: ApplicationState, private location: Location) {

    this.appState.title = 'Settings';
  }

  async save() {
    await this.appState.save();

    this.location.back();
  }
}
