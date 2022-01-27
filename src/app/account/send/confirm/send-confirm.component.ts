import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommunicationService } from '../../../services/communication.service';
import { SendService } from '../../../services/send.service';

@Component({
    selector: 'app-account-send-confirm',
    templateUrl: './send-confirm.component.html',
    styleUrls: ['./send-confirm.component.css']
})
export class AccountSendConfirmComponent implements OnInit, OnDestroy {
    sub: any;
    transaction: any;

    constructor(
        public sendService: SendService,
        private communication: CommunicationService) {

    }

    ngOnDestroy() {
        if (this.sub) {
            this.communication.unlisten(this.sub);
        }
    }

    async ngOnInit() {
        this.sub = this.communication.listen('transaction-created', async (data: { transactionId: string, fee: number, feeRate: number }) => {
            debugger;
            this.transaction = data;
        });

        this.communication.send('transaction-create', { address: this.sendService.address, amount: this.sendService.amountAsSatoshi, fee: this.sendService.feeAsSatoshi });
    }
}