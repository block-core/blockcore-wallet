import { Component, OnDestroy, OnInit } from '@angular/core';
import { SendService, SendSidechainService, WalletManager } from '../../../services';

@Component({
    selector: 'app-account-send-confirm',
    templateUrl: './send-confirm.component.html',
    styleUrls: ['./send-confirm.component.css']
})
export class AccountSendSidechainConfirmComponent implements OnInit, OnDestroy {
    sub: any;
    transaction: any;
    error: string;
    detailsOpen = false;
    invalidFeeAmount = false;
    loading = true;
    valid = false;

    constructor(
        public sendService: SendService,
        public sendSidechainService: SendSidechainService,
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
                this.sendService.accountHistory.unspent,
                this.sendSidechainService.sidechainAddress ?? null);

            this.transaction = tx;
            this.sendService.transactionHex = tx.transactionHex;
            this.sendService.addresses = tx.addresses;
            this.invalidFeeAmount = this.transaction.feeRate < this.sendService.feeRate;

            // TODO: Add aditional conditions here if needed for validating the transaction before allowing
            // it to be broadcasted. Perhaps checking the network status?
            if (this.invalidFeeAmount) {
                this.valid = false;
            } else {
                this.valid = true;
            }

        } catch (err: any) {
            console.error(err);
            this.error = err.message;
        }

        this.loading = false;
    }
}