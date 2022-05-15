import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'size' })
export class SizePipe implements PipeTransform {
    transform(value: number): string {
        return (value / 1024).toFixed(3) + 'kB';
    }
}