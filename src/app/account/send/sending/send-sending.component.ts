import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommunicationService } from '../../../services/communication.service';
import { SendService } from '../../../services/send.service';
import { UIState } from '../../../services/ui-state.service';

@Component({
    selector: 'app-account-send-sending',
    templateUrl: './send-sending.component.html',
    styleUrls: ['./send-sending.component.css']
})
export class AccountSendSendingComponent implements OnInit, OnDestroy {
    sub: any;

    constructor(
        private router: Router,
        public sendService: SendService,
        private communication: CommunicationService,
        public uiState: UIState) {
        // When the transaction is done, we'll make sure the back button sends back to home.
        this.uiState.goBackHome = true;
    }

    ngOnDestroy() {
        if (this.sub) {
            this.communication.unlisten(this.sub);
        }
    }

    async ngOnInit() {
        this.sendService.loading = true;

        this.sub = this.communication.listen('transaction-sent', async (data: { transactionId: string, transactionHex: string }) => {
            debugger;
            this.sendService.loading = false;
            this.sendService.transactionId = data.transactionId;
            this.sendService.transactionHex = data.transactionHex;
            this.router.navigateByUrl('/account/send/success');
        });

        this.communication.send('transaction-send', { transactionHex: this.sendService.transactionHex });
    }
}