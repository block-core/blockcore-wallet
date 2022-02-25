import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { EnvironmentService } from '../../services';
import { UIState } from '../../services/ui-state.service';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AboutComponent implements OnDestroy {
    @HostBinding('class.changes') hostClass = true;

    constructor(public uiState: UIState,
        public env: EnvironmentService) {
        this.uiState.title = 'About';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;

        
    }

    ngOnDestroy() {
    }
}
