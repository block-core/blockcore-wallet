import { Pipe, PipeTransform } from '@angular/core';
import { IndexerApiStatus } from 'src/shared';
import { NetworksService } from '../services/networks.service';

@Pipe({
    name: 'networkStatus'
})
export class NetworkStatusPipe implements PipeTransform {
    constructor() {

    }

    transform(value: number): any {
        if (!value == null) {
            return '?';
        }

        return IndexerApiStatus[value].toLowerCase();
    }
}