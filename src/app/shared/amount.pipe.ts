import { Pipe, PipeTransform } from '@angular/core';
import * as satcomma from 'satcomma';
import { UIState } from '../services/ui-state.service';

@Pipe({ name: 'amount', pure: false })
export class AmountPipe implements PipeTransform {

    constructor(public uiState: UIState) {

    }

    transform(value: number | BigInt): string {
        if (this.uiState.persisted.settings.amountFormat == 'sat') {
            return value.toString();
        }
        else if (this.uiState.persisted.settings.amountFormat == 'bitcoin') {
            return (value as number / 100000000).toFixed(8);
        }
        else {
            const formatted = satcomma.fromSats(value, { validateBitcoinMaxSupply: false });
            const values = formatted.split('.');
            return (+values[0]).toLocaleString('en-US', { maximumFractionDigits: 0 }) + '.' + values[1];
        }
    }
}
