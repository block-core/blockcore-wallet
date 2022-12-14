import { Pipe, PipeTransform } from '@angular/core';
import Big from 'big.js';
import * as satcomma from 'satcomma';
import { SettingsService } from '../services/settings.service';
import { SATOSHI_FACTOR } from './constants';

@Pipe({ name: 'amount', pure: false })
export class AmountPipe implements PipeTransform {
  constructor(public settings: SettingsService) {}

  transform(value: number | Big, decimals = 8, useFormat = true): string {
    let amountFormat = this.settings.values.amountFormat;
    const factor = Number('1' + ''.padStart(decimals, '0')) 

    if (amountFormat == 'bitcoin' || useFormat == false) {
      if (typeof value === 'bigint') {
        return (Number(value) / factor ).toFixed(decimals);
      } else {
        return ((value as number) / factor ).toFixed(decimals);
      }
    } else if (amountFormat == 'sat') {
      return value.toString();
    } else {
      const formatted = satcomma.fromSats(value, { validateBitcoinMaxSupply: false });
      const values = formatted.split('.');
      return (+values[0]).toLocaleString('en-US', { maximumFractionDigits: 0 }) + '.' + values[1];
    }

  }
}
