import { Component, OnInit, OnDestroy } from '@angular/core';
import { UIState } from '../../services';
import { ActionService } from 'src/app/services/action.service';

@Component({
    selector: 'app-sign-psbt',
    templateUrl: './signpsbt.component.html',
    styleUrls: ['./signpsbt.component.css'],
})
export class ActionSignPsbtComponent implements OnInit, OnDestroy {
    content: string;

    constructor(public uiState: UIState, public actionService: ActionService) {
        this.actionService.consentType = 'regular';
    }

    ngOnDestroy(): void { }

    ngOnInit(): void {
        // The content to be signed will be a PSBT represented in a string

        this.content = this.uiState.action.content;

    }
}
