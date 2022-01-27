import { Component, OnDestroy, OnInit } from '@angular/core';
import { SendService } from '../../../services/send.service';
import { UIState } from '../../../services/ui-state.service';

@Component({
    selector: 'app-account-send-success',
    templateUrl: './send-success.component.html',
    styleUrls: ['./send-success.component.css']
})
export class AccountSendSuccessComponent implements OnInit, OnDestroy {
    constructor(
        public sendService: SendService,
        public uiState: UIState) {
        // When the transaction is done, we'll make sure the back button sends back to home.
        this.uiState.goBackHome = true;
    }

    ngOnDestroy() {

    }

    async ngOnInit() {
    }
}