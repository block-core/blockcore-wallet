import { Component, Input } from '@angular/core';
import { IndexerApiStatus, NetworkStatus } from '../../../shared/interfaces';

@Component({
    selector: 'app-network-status',
    template: '<span class="material-icons network-status" [ngClass]="class">circle</span>',
    styles: ['.network-status { font-size: 0.6em;} .network-status-syncing { color: orange; } .network-status-online { color: green; }  .network-status-error { color: red; } .network-status-offline { color: red; } .network-status-unknown { color: gray; }']
})
export class NetworkStatusComponent {
    @Input() status: NetworkStatus[];
    @Input() value: number;

    constructor() {
    }

    get class(): string {
        // Value will override status.
        if (this.value) {
            return `network-status-${IndexerApiStatus[this.value].toLowerCase()}`;
        } else {
            if (!this.status || this.status.length === 0) {
                return `network-status-offline`;
            } else {
                const availableCount = this.status.filter(s => s.availability == 1).length;
                if (availableCount == 0) {
                    return `network-status-offline`;
                } else {
                    return `network-status-online`;
                }
            }
        }

        // if (this.status) {

        //     const apiStatus = IndexerApiStatus[this.status.availability].toLowerCase();
        //     return `network-status-${apiStatus}`;

        // } else {
        //     return 'network-status-unknown';
        // }
    }
}