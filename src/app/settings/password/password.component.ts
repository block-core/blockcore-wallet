import { Location } from '@angular/common';
import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { UIState } from 'src/app/services/ui-state.service';

@Component({
    selector: 'app-password',
    templateUrl: './password.component.html',
    styleUrls: ['./password.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PasswordComponent implements OnDestroy {
    @HostBinding('class.privacy') hostClass = true;

    existingPassword?: string;
    newPassword?: string;
    confirmedPassword?: string;

    constructor(public uiState: UIState, public location: Location) {
        this.uiState.title = 'Change password';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;
    }

    ngOnDestroy() {

    }

    save() {

    }

    cancel() {
        this.location.back();
    }
}
