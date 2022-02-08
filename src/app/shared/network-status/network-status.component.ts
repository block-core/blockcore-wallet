import { Component, Input } from '@angular/core';
import { NetworkStatus } from '../../interfaces';
import { NetworkStatusService } from '../../services/network-status.service';

@Component({
    selector: 'app-network-status',
    template: '<span class="network-status" [matTooltip]="status?.status" [ngClass]="class">.</span>',
    styles: ['.network-status { font-size: 3em;} .network-status-positive { color: green; }  .network-status-negative { color: red; } .network-status-uknown { color: gray; }']
})
export class NetworkStatusComponent {
    @Input() status: NetworkStatus;

    sub: any;

    constructor(private networkStatus: NetworkStatusService) {
        // this.sub = networkStatus.networks$.subscribe(() => {

        // });
    }

    get class(): string {
        if (this.status) {
            if (this.status.available == false) {
                return 'network-status-negative';
            } else {
                return 'network-status-positive';
            }
        } else {
            return 'network-status-uknown';
        }
    }
}