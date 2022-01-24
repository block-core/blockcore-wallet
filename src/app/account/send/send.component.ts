import { Component, Inject, HostBinding, OnDestroy, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState } from '../../services/ui-state.service';
import { OrchestratorService } from '../../services/orchestrator.service';
import { CommunicationService } from '../../services/communication.service';
import { IconService } from '../../services/icon.service';
import { copyToClipboard } from '../../shared/utilities';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as QRCode from 'qrcode';
import { Address, UnspentTransactionOutput } from '../../interfaces';
import { NetworksService } from '../../services/networks.service';
import { Network } from '../../../background/networks';
var QRCode2 = require('qrcode');
import { TransactionBuilder } from 'bitcoinjs-lib';

@Component({
    selector: 'app-account-send',
    templateUrl: './send.component.html',
    styleUrls: ['./send.component.css']
})
export class AccountSendComponent implements OnInit, OnDestroy {
    addressEntry: Address;
    address: string;
    qrCode: string;
    network: Network;
    unspent: UnspentTransactionOutput[];

    constructor(public uiState: UIState,
        private renderer: Renderer2,
        private networks: NetworksService,
        private snackBar: MatSnackBar) {
        // this.uiState.title = 'Receive Address';
        this.uiState.goBackHome = false;

        const account = this.uiState.activeAccount;
        this.network = this.networks.getNetwork(account.network, account.purposeAddress);
    }

    ngOnDestroy(): void {

    }

    copy() {
        copyToClipboard(this.address);

        this.snackBar.open('Receive address copied to clipboard', 'Hide', {
            duration: 1500,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
        });
    }

    async ngOnInit() {
        // TODO: When can we start using .lastItem and similar functions on arrays?
        this.addressEntry = this.uiState.activeAccount.state.receive[this.uiState.activeAccount.state.receive.length - 1];
        this.address = this.addressEntry.address;

        debugger;

        const unspentReceive = this.uiState.activeAccount.state.receive.flatMap(i => i.unspent).filter(i => i !== undefined);
        const unspentChange = this.uiState.activeAccount.state.change.flatMap(i => i.unspent).filter(i => i !== undefined);

        this.unspent = [...unspentReceive, ...unspentChange];

        console.log(this.unspent);

        // var tx = new TransactionBuilder(this.network);
        // tx.addInput("0c105b8c127e7d0c1ae82b3c31546535608235d5428f5673106e40d0b19a7119", 2);
        // tx.addOutput("12idKQBikRgRuZEbtxXQ4WFYB7Wa3hZzhT", 149000); // 1000 satoshis will be taken as fee.

        // tx.sign(0, key);
        // console.log(tx.build().toHex());

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