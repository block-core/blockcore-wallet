import { Component, Inject, HostBinding } from '@angular/core';
import { Location } from '@angular/common'
import { UIState } from '../services/ui-state.service';
import { StateService } from '../services';
import { RuntimeService } from '../../shared/runtime.service';

@Component({
    selector: 'app-sign',
    templateUrl: './sign.component.html',
    styleUrls: ['./sign.component.css']
})
export class SignComponent {
    constructor(
        private location: Location,
        public uiState: UIState,
        private state: StateService,
        private runtime: RuntimeService
    ) {
        this.uiState.title = 'Sign & Verify';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = true;
    
    }

}
