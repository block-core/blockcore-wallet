import { Component, Input } from '@angular/core';
import { IndexerApiStatus, NetworkStatus } from '../../../shared/interfaces';

@Component({
    selector: 'app-network-status-card',
    templateUrl: './network-status-card.component.html',
    styleUrls: ['./network-status-card.component.css']
})
export class NetworkStatusCardComponent {
    @Input() status: NetworkStatus;

    constructor() {
    }

    get class(): string {
        if (this.status) {
            const apiStatus = IndexerApiStatus[this.status.availability].toLowerCase();
            return `network-status-${apiStatus}`;

        } else {
            return 'network-status-unknown';
        }
    }

    getNetworkStatusLabel(status: IndexerApiStatus) {
        return IndexerApiStatus[status];
    }
}