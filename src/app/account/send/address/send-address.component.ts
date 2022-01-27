import { Component, OnDestroy, OnInit } from '@angular/core';
import { SendService } from '../../../services/send.service';

@Component({
    selector: 'app-account-send-address',
    templateUrl: './send-address.component.html'
})
export class AccountSendAddressComponent implements OnInit, OnDestroy {
    constructor(public sendService: SendService) {

    }

    ngOnDestroy() {

    }

    async ngOnInit() {
    }
}