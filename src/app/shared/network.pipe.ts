import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'network'
})
export class NetworkPipe implements PipeTransform {

    private units: any = {
        "0": "BTC",
        "1926": "CITY",
        "105105": "STRAX",
        "616": "IDENTITY"
    };

    transform(value: number): any {
        if (!value == null) {
            return '?';
        }

        if (isNaN(Number(value))) {
            return '?';
        }

        return this.units[value];
    }
}