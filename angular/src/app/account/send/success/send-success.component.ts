import { Component, OnDestroy, OnInit } from '@angular/core';
import { SendService, UIState } from '../../../services';

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
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;
        this.uiState.backUrl = '/account/view/' + sendService.account.identifier;
    }

    ngOnDestroy() {

    }

    async ngOnInit() {
    }
}