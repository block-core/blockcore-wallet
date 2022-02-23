import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { UIState, CommunicationService, NetworksService, SendService, WalletManager } from '../../services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Address, UnspentTransactionOutput } from '../../interfaces';
import { Network } from '../../services/networks';

@Component({
    selector: 'app-account-send',
    templateUrl: './send.component.html',
    styleUrls: ['./send.component.css']
})
export class AccountSendComponent implements OnInit, OnDestroy {
    addressEntry: Address;
    address: string = '';
    // amount: string = '100000000'; // 1 coin
    // fee: string = '00100000'; // 0.001 coin
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
        private snackBar: MatSnackBar) {
        // this.uiState.title = 'Receive Address';
        this.uiState.goBackHome = false;

        sendService.reset();

        const account = this.walletManager.activeAccount;
        const network = this.networks.getNetwork(account.networkType);

        sendService.account = account;
        sendService.network = network;
        sendService.resetFee(); // Reset fee after we have network available.

        this.network = network;
    }

    // send() {
    //     this.loading = true;
    //     this.communication.send('transaction-send', { address: this.address, amount: this.amount, fee: this.fee });
    // }

    ngOnDestroy(): void {
        if (this.sub) {
            this.communication.unlisten(this.sub);
        }
    }

    // copy() {
    //     copyToClipboard(this.address);

    //     this.snackBar.open('Receive address copied to clipboard', 'Hide', {
    //         duration: 1500,
    //         horizontalPosition: 'center',
    //         verticalPosition: 'bottom',
    //     });
    // }

    async ngOnInit() {
        // TODO: When can we start using .lastItem and similar functions on arrays?
        // this.addressEntry = this.uiState.activeAccount.state.receive[this.uiState.activeAccount.state.receive.length - 1];
        // this.address = this.addressEntry.address;

        const unspentReceive = this.walletManager.activeAccount.state.receive.flatMap(i => i.unspent).filter(i => i !== undefined);
        const unspentChange = this.walletManager.activeAccount.state.change.flatMap(i => i.unspent).filter(i => i !== undefined);

        this.unspent = [...unspentReceive, ...unspentChange];

        console.log(this.unspent);

        // this.sub = this.communication.listen('transaction-sent', async (data: { transactionId: string, transactionHex: string }) => {
        //     this.loading = false;
        //     debugger;
        //     this.transactionHex = data.transactionHex;
        // });

        // try {
        //     this.qrCode = await QRCode.toDataURL(this.address, {
        //         errorCorrectionLevel: 'L',
        //         margin: 2,
        //         scale: 5,
        //     });

        //     // LEFT TO HAVE INSTRUCTIONS ON POSSIBLE OPTIONS :-)
        //     // this.qrCode = await QRCode.toDataURL(this.address, {
        //     //     // version: this.version,
        //     //     errorCorrectionLevel: 'L',
        //     //     // margin: this.margin,
        //     //     // scale: this.scale,
        //     //     // width: this.width,
        //     //     // color: {
        //     //     //     dark: this.colorDark,
        //     //     //     light: this.colorLight
        //     //     // }
        //     // });

        // } catch (err) {
        //     console.error(err);
        // }
    }
}