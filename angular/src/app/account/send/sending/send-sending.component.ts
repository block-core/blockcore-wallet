import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AddressWatchStore } from 'src/shared/store/address-watch-store';
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
        private addressWatchStore: AddressWatchStore,
        public uiState: UIState) {
        // When the transaction is done, we'll make sure the back button sends back to home.
        this.uiState.goBackHome = true;
    }

    ngOnDestroy() {

    }

    async ngOnInit() {
        this.sendService.loading = true;

        const transactionDetails = await this.walletManager.sendTransaction(this.sendService.account, this.sendService.transactionHex);

        this.sendService.loading = false;
        this.sendService.transactionId = transactionDetails.transactionId;
        this.sendService.transactionHex = transactionDetails.transactionHex;

        // Reload the watch store to ensure we have latest state, the watcher might have updated (and removed) some values.
        await this.addressWatchStore.load();

        for (let i = 0; i < this.sendService.addresses.length; i++) {
            const address = this.sendService.addresses[i];

            let index = this.sendService.account.state.receive.findIndex(a => a.address == address);

            if (index === -1) {
                index = this.sendService.account.state.change.findIndex(a => a.address == address);
            }

            // If we cannot find the address that is involved with this transaction, don't add a watch.
            if (index > -1) {
                this.addressWatchStore.set(address, {
                    address,
                    accountId: this.sendService.account.identifier,
                    count: 0
                });
            }
        }

        // Save the watch store so the background watcher will see the new entries.
        await this.addressWatchStore.save();

        this.router.navigateByUrl('/account/send/success');
    }
}