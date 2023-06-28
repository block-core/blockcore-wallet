import { Location } from '@angular/common';
import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { UIState, CommunicationService, FeatureService } from '../../services';

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
        private communication: CommunicationService,
        public feature: FeatureService,
        public translate: TranslateService
    ) {
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;
    }

    async ngOnInit() {
      this.uiState.title = await this.translate.get('Settings.ProtocolHandlers').toPromise();
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
