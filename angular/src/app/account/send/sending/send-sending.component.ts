import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommunicationService, SendService, UIState, WalletManager } from '../../../services';

@Component({
    selector: 'app-account-send-sending',
    templateUrl: './send-sending.component.html',
    styleUrls: ['./send-sending.component.css']
})
export class AccountSendSendingComponent implements OnInit, OnDestroy {

    constructor(
        private router: Router,
        public sendService: SendService,
        private communication: CommunicationService,
        public walletManager: WalletManager,
        public uiState: UIState) {
        // When the transaction is done, we'll make sure the back button sends back to home.
        this.uiState.goBackHome = true;
    }

    ngOnDestroy() {

    }

    async ngOnInit() {
        this.sendService.loading = true;

        // const wallet = this.walletManager.getWallet(data.walletId);
        // const account = this.walletManager.getAccount(wallet, data.accountId);

        // addresses: this.sendService.addresses

        // // Watch the address that belongs to the selected inputs used in the transaction.
        // for (let i = 0; i < data.addresses.length; i++) {
        //     this.indexer.watchAddress(data.addresses[i], account);
        // }

        const transactionDetails = await this.walletManager.sendTransaction(this.sendService.account, this.sendService.transactionHex);

        this.sendService.loading = false;
        this.sendService.transactionId = transactionDetails.transactionId;
        this.sendService.transactionHex = transactionDetails.transactionHex;

        this.router.navigateByUrl('/account/send/success');

        // this.sub = this.communication.listen('transaction-sent', async (data: { transactionId: string, transactionHex: string }) => {
        //     this.sendService.loading = false;
        //     this.sendService.transactionId = data.transactionId;
        //     this.sendService.transactionHex = data.transactionHex;
        //     this.router.navigateByUrl('/account/send/success');
        // });

        // this.communication.send('transaction-send', { walletId: this.walletManager.activeWallet.id, accountId: this.sendService.account.identifier, addresses: this.sendService.addresses, transactionHex: this.sendService.transactionHex });
    }
}