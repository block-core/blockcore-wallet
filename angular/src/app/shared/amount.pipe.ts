import { Pipe, PipeTransform } from '@angular/core';
import Big from 'big.js';
import * as satcomma from 'satcomma';
import { SettingsService } from '../services/settings.service';
import { SATOSHI_FACTOR } from './constants';

@Pipe({ name: 'amount', pure: false })
export class AmountPipe implements PipeTransform {

    constructor(public settings: SettingsService) {

    }

    transform(value: number | Big): string {
        if (this.settings.values.amountFormat == 'sat') {
            return value.toString();
        }
        else if (this.settings.values.amountFormat == 'bitcoin') {
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
