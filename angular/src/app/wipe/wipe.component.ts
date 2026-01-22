import { Component, Inject, HostBinding } from '@angular/core';
import { Location } from '@angular/common'
import { UIState } from '../services/ui-state.service';
import { StateService } from '../services';
import { RuntimeService } from '../../shared/runtime.service';
import * as browser from 'webextension-polyfill';

@Component({
    selector: 'app-wipe',
    templateUrl: './wipe.component.html',
    styleUrls: ['./wipe.component.css']
})
export class WipeComponent {
    constructor(
        private location: Location,
        public uiState: UIState,
        private state: StateService,
        private runtime: RuntimeService
    ) {
        this.uiState.title = 'Wipe Data';
    }

    async wipe() {
        await this.state.wipe();

        if (this.runtime.isExtension) {
            browser.runtime.reload();
        } else {
            window.location.reload();
        }
    }

    cancel() {
        this.location.back();
    }
}
