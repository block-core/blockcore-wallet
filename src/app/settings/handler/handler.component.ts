import { Location } from '@angular/common';
import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UIState } from 'src/app/services/ui-state.service';
import { CommunicationService } from '../../services/communication.service';
import { FeatureService } from '../../services/features.service';
import { OrchestratorService } from '../../services/orchestrator.service';

@Component({
    selector: 'app-handler',
    templateUrl: './handler.component.html',
    styleUrls: ['./handler.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HandlerComponent implements OnDestroy {
    constructor(
        public uiState: UIState,
        public location: Location,
        private snackBar: MatSnackBar,
        private manager: OrchestratorService,
        private communication: CommunicationService,
        public feature: FeatureService,
    ) {
        this.uiState.title = 'Protocol Handlers';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;
    }

    ngOnDestroy() {

    }

    cancel() {
        this.location.back();
    }

    registerHandler(protocol: string, parameter: string) {
        // navigator.registerProtocolHandler(protocol, `./index.html?${parameter}=%s`);
        navigator.registerProtocolHandler(protocol, `/index.html?${parameter}=%s`);
    }
}
