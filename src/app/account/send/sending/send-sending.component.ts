import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SendService } from '../../../services/send.service';
import { UIState } from '../../../services/ui-state.service';

@Component({
    selector: 'app-account-send-sending',
    templateUrl: './send-sending.component.html',
    styleUrls: ['./send-sending.component.css']
})
export class AccountSendSendingComponent implements OnInit, OnDestroy {
    constructor(
        private router: Router,
        public sendService: SendService,
        public uiState: UIState) {
        // When the transaction is done, we'll make sure the back button sends back to home.
        this.uiState.goBackHome = true;
    }

    ngOnDestroy() {

    }

    async ngOnInit() {
        setTimeout(() => {
            // this.router.navigateByUrl('/');
        }, 1000);
    }
}