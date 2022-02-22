import { Component, Input } from '@angular/core';
import { IndexerApiStatus, NetworkStatus } from '../../interfaces';

@Component({
    selector: 'app-network-status',
    template: '<mat-icon class="network-status" [matTooltip]="status?.status" [ngClass]="class">circle</mat-icon>',
    styles: ['.network-status { font-size: 0.6em;} .network-status-syncing { color: orange; } .network-status-online { color: green; }  .network-status-error { color: red; } .network-status-offline { color: red; } .network-status-unknown { color: gray; }']
})
export class NetworkStatusComponent {
    @Input() status: NetworkStatus;

    constructor() {
    }

    get class(): string {
        if (this.status) {
            debugger;
            console.log(this.status.availability);
            const apiStatus = IndexerApiStatus[this.status.availability].toLowerCase();
            return `network-status-${apiStatus}`;

        } else {
            return 'network-status-unknown';
        }
    }
}