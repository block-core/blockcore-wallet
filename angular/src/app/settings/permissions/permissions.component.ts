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

    permissions: any[];

    constructor(
        public uiState: UIState,
        public location: Location,
        public networkStatus: NetworkStatusService,
        public feature: FeatureService,
    ) {
        this.uiState.title = 'Permissions';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;

        this.permissions = [{
            domain: 'epmiiicbebgckgoggnflbpcglnabbage',
            created: new Date(),
            condition: 'forever',
            level: 1
        },
        {
            domain: 'http://localhost:3000',
            created: new Date(),
            condition: 'expires',
            level: 2
        }];

    }

    remove(permission: any)
    {
        alert('remove!');
    }

    ngOnDestroy() {

    }

    cancel() {
        this.location.back();
    }
}
