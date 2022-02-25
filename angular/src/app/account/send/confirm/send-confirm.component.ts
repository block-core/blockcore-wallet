import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommunicationService, SendService, UIState, WalletManager } from '../../../services';

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
        private uiState: UIState,
        public walletManager: WalletManager,
        private communication: CommunicationService) {

    }

    ngOnDestroy() {

    }

    async ngOnInit() {
        // this.sub = this.communication.listen('transaction-created', async (data: { addresses: string[], transactionHex: string, fee: number, feeRate: number }) => {
        //     this.transaction = data;
        //     this.sendService.transactionHex = data.transactionHex;
        //     this.sendService.addresses = data.addresses;
        // });

        // this.communication.send('transaction-create', { walletId: this.walletManager.activeWallet.id, accountId: this.sendService.account.identifier, address: this.sendService.address, amount: this.sendService.amountAsSatoshi, fee: this.sendService.feeAsSatoshi });
    }
}