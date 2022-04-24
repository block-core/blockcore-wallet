import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
    transform(value: string | any): any {
        if (value == null) {
            return '';
        }

        return (value.length > 20) ? value.substr(0, 20 - 1) + '...' : value;
    }
}