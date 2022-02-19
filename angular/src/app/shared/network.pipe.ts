import { Pipe, PipeTransform } from '@angular/core';
import { NetworksService } from '../services/networks.service';

@Pipe({
    name: 'network'
})
export class NetworkPipe implements PipeTransform {
    constructor(private networkService: NetworksService) {

    }

    transform(value: { networkType: string }): any {
        if (!value == null || !value.networkType == null) {
            return '?';
        }

        const network = this.networkService.getNetwork(value.networkType);
        return network.symbol;
    }
}