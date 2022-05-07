import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { UIState } from 'src/app/services/ui-state.service';

@Component({
    selector: 'app-changes',
    templateUrl: './changes.component.html',
    styleUrls: ['./changes.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ChangesComponent implements OnDestroy {
    // @HostBinding('class.changes') hostClass = true;

    constructor(public uiState: UIState) {
        this.uiState.title = 'Changes';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;
    }

    ngOnDestroy() {
    }
}
