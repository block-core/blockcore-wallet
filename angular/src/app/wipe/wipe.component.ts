import { Component, Inject, HostBinding } from '@angular/core';
import { Location } from '@angular/common'
import { UIState } from '../services/ui-state.service';
import { StateService } from '../services';

@Component({
    selector: 'app-wipe',
    templateUrl: './wipe.component.html',
    styleUrls: ['./wipe.component.css']
})
export class WipeComponent {
    constructor(
        private location: Location,
        public uiState: UIState,
        private state: StateService
    ) {
        this.uiState.title = 'Wipe Data';
    }

    async wipe() {
        await this.state.wipe();
        chrome.runtime.reload();
    }

    cancel() {
        this.location.back();
    }
}
