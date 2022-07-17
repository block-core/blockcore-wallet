import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { EnvironmentService } from '../../services';
import { UIState } from '../../services/ui-state.service';

@Component({
    selector: 'app-biometric',
    templateUrl: './biometric.component.html',
    styleUrls: ['./biometric.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class BiometricComponent implements OnDestroy {
    // @HostBinding('class.changes') hostClass = true;

    constructor(public uiState: UIState,
        public env: EnvironmentService) {
        this.uiState.title = 'Biometric';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;


    }

    registerCredential()
    {

    }

    ngOnDestroy() {
    }
}
