import { Location } from '@angular/common';
import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { UIState } from 'src/app/services/ui-state.service';

@Component({
    selector: 'app-recovery',
    templateUrl: './recovery.component.html',
    styleUrls: ['./recovery.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class RecoveryComponent implements OnDestroy {
    @HostBinding('class.privacy') hostClass = true;

    password?: string;

    constructor(public uiState: UIState, public location: Location) {
        this.uiState.title = 'Recovery Phrase';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;
    }

    ngOnDestroy() {

    }

    show() {
        alert('Not implemented yet.');
    }

    cancel() {
        this.location.back();
    }
}
