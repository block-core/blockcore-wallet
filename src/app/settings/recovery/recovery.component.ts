import { Location } from '@angular/common';
import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommunicationService } from 'src/app/services/communication.service';
import { UIState } from 'src/app/services/ui-state.service';
import { copyToClipboard } from 'src/app/shared/utilities';

@Component({
    selector: 'app-recovery',
    templateUrl: './recovery.component.html',
    styleUrls: ['./recovery.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class RecoveryComponent implements OnDestroy {
    @HostBinding('class.privacy') hostClass = true;

    password?: string;

    sub: any;

    mnemonic: string = '';

    constructor(
        public uiState: UIState,
        public location: Location,
        private communication: CommunicationService) {
        this.uiState.title = 'Recovery Phrase';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;

        this.sub = this.communication.listen('wallet-exported-recovery-phrase', (mnemonic: string) => {
            console.log('Received:', mnemonic);
            this.mnemonic = mnemonic;
        });
    }

    ngOnDestroy() {
        this.mnemonic = '';

        if (this.sub) {
            this.communication.unlisten(this.sub);
        }
    }

    show() {
        this.communication.send('wallet-export-recovery-phrase', { id: this.uiState.activeWallet?.id, password: this.password});
    }

    cancel() {
        this.mnemonic = '';
        this.location.back();
    }

    copy() {
        copyToClipboard(this.mnemonic);
    }
}
