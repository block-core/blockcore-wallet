import { Component, Input, OnInit } from '@angular/core';
import { NetworkStatusService } from 'src/app/services';
import { IndexerApiStatus, NetworkStatus } from '../../../shared/interfaces';

@Component({
    selector: 'app-network-status-card',
    templateUrl: './network-status-card.component.html',
    styleUrls: ['./network-status-card.component.css']
})
export class NetworkStatusCardComponent implements OnInit {
    @Input() status: NetworkStatus;
    @Input() type: string;

    constructor(private networkStatusService: NetworkStatusService) {

    }

    ngOnInit(): void {
        if (this.type) {
            this.status = this.networkStatusService.get(this.type);
        }
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