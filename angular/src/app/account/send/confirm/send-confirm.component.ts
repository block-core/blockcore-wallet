import { Component, OnDestroy, OnInit } from '@angular/core';
import { SendService, WalletManager } from '../../../services';

@Component({
    selector: 'app-account-send-confirm',
    templateUrl: './send-confirm.component.html',
    styleUrls: ['./send-confirm.component.css']
})
export class AccountSendConfirmComponent implements OnInit, OnDestroy {
    sub: any;
    transaction: any;
    error: string;
    detailsOpen = false;
    invalidFeeAmount = false;
    loading = false;

    constructor(
        public sendService: SendService,
        public walletManager: WalletManager) {

    }

    ngOnDestroy() {

    }

    toggleDetails() {
        this.detailsOpen = !this.detailsOpen;
    }

    async ngOnInit() {
        try {
            const tx = await this.walletManager.createTransaction(
                this.walletManager.activeWallet,
                this.walletManager.activeAccount,
                this.sendService.address,
                this.sendService.changeAddress,
                this.sendService.amountAsSatoshi,
                this.sendService.feeAsSatoshi,
                this.sendService.accountHistory.unspent);

            this.transaction = tx;
            this.sendService.transactionHex = tx.transactionHex;
            this.sendService.addresses = tx.addresses;

            this.invalidFeeAmount = this.transaction.feeRate < this.sendService.feeRate;

        } catch (err: any) {
            console.error(err);
            this.error = err.message;
        }
    }
}