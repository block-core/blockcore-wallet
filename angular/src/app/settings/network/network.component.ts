import { Location } from '@angular/common';
import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UIState, CommunicationService, FeatureService, NetworkStatusService } from '../../services';

@Component({
    selector: 'app-network',
    templateUrl: './network.component.html',
    styleUrls: ['./network.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NetworkComponent implements OnDestroy {
    constructor(
        public uiState: UIState,
        public location: Location,
        private snackBar: MatSnackBar,
        private communication: CommunicationService,
        public networkStatus: NetworkStatusService,
        public feature: FeatureService,
    ) {
        this.uiState.title = 'Network Status';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;

        

    }

    ngOnDestroy() {

    }

    cancel() {
        this.location.back();
    }
}
