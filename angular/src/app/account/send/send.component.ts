import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { UIState, CommunicationService, NetworksService, SendService, WalletManager } from '../../services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AccountHistory, Address, UnspentTransactionOutput } from '../../../shared/interfaces';
import { Network } from '../../../shared/networks';
import { AccountHistoryStore } from 'src/shared';
import { AccountStateStore } from 'src/shared/store/account-state-store';

@Component({
    selector: 'app-account-send',
    templateUrl: './send.component.html',
    styleUrls: ['./send.component.css']
})
export class AccountSendComponent implements OnInit, OnDestroy {
    addressEntry: Address;
    address: string = '';
    qrCode: string;
    network: Network;
    unspent: UnspentTransactionOutput[];
    sub: any;
    transactionHex: string;
    loading = false;

    constructor(public uiState: UIState,
        public sendService: SendService,
        private renderer: Renderer2,
        private networks: NetworksService,
        private communication: CommunicationService,
        public walletManager: WalletManager,
        private accountHistoryStore: AccountHistoryStore,
        private accountStateStore: AccountStateStore,
        private snackBar: MatSnackBar) {
        // this.uiState.title = 'Receive Address';
        this.uiState.goBackHome = false;
        this.uiState.backUrl = null;

        sendService.reset();

        const account = this.walletManager.activeAccount;
        const network = this.networks.getNetwork(account.networkType);

        sendService.account = account;
        sendService.network = network;
        sendService.resetFee(); // Reset fee after we have network available.
        sendService.accountHistory = accountHistoryStore.get(account.identifier);

        // When using CRS/TCRS, the change address should always be the primary address.
        if (network.singleAddress === true || account.singleAddress === true) {
            const accountState = this.accountStateStore.get(account.identifier);
            const primaryReceiveAddress = accountState.receive[0];
            sendService.changeAddress = primaryReceiveAddress.address;
        }

        this.network = network;
    }

    ngOnDestroy(): void {

    }

    async ngOnInit() {
        const accountState = this.accountStateStore.get(this.walletManager.activeAccount.identifier);
        const unspentReceive = accountState.receive.flatMap(i => i.unspent).filter(i => i !== undefined);
        const unspentChange = accountState.change.flatMap(i => i.unspent).filter(i => i !== undefined);

        this.unspent = [...unspentReceive, ...unspentChange];
    }
}