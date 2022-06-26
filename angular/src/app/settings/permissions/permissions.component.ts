import { Location } from '@angular/common';
import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { UIState, FeatureService, NetworkStatusService } from '../../services';

@Component({
    selector: 'app-permissions',
    templateUrl: './permissions.component.html',
    styleUrls: ['./permissions.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PermissionsComponent implements OnDestroy {
    constructor(
        public uiState: UIState,
        public location: Location,
        public networkStatus: NetworkStatusService,
        public feature: FeatureService,
    ) {
        this.uiState.title = 'Permissions';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;
    }

    ngOnDestroy() {

    }

    cancel() {
        this.location.back();
    }
}
