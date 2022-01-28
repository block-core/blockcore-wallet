import { Pipe, PipeTransform } from '@angular/core';
import * as satcomma from 'satcomma';
import { UIState } from '../services/ui-state.service';
import { SATOSHI_FACTOR } from './constants';

@Pipe({ name: 'amount', pure: false })
export class AmountPipe implements PipeTransform {

    constructor(public uiState: UIState) {

    }

    transform(value: number | BigInt): string {
        if (this.uiState.persisted.settings.amountFormat == 'sat') {
            return value.toString();
        }
        else if (this.uiState.persisted.settings.amountFormat == 'bitcoin') {
            if (typeof value === 'bigint') {
                return (Number(value) / SATOSHI_FACTOR).toFixed(8);
            } else {
                return (value as number / SATOSHI_FACTOR).toFixed(8);
            }
        }
        else {
            const formatted = satcomma.fromSats(value, { validateBitcoinMaxSupply: false });
            const values = formatted.split('.');
            return (+values[0]).toLocaleString('en-US', { maximumFractionDigits: 0 }) + '.' + values[1];
        }
    }
}
