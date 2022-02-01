import { Pipe, PipeTransform } from '@angular/core';
import { NetworksService } from '../services/networks.service';

@Pipe({
    name: 'network'
})
export class NetworkPipe implements PipeTransform {
    constructor(private networkService: NetworksService) {

    }

    transform(value: { network: number, purpose: number }): any {
        if (!value == null || !value.network == null || !value.purpose == null) {
            return '?';
        }

        const network = this.networkService.getNetwork(value.network, value.purpose);
        return network.symbol;
    }
}