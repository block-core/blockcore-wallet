import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import Big from 'big.js';
import { SendService } from './send.service';

export class InputValidators {
    static maximumBitcoin(sendService: SendService): ValidatorFn {
        return maxBitcoinValidator(sendService);
    }
}

export function maxBitcoinValidator(sendService: SendService): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {

        let max = sendService.accountHistory.balance;

        if (isEmpty(control.value) || isEmpty(max)) {
            return null;
        }

        let maxNumber = Big(max);
        let maxNumberPlusFee = maxNumber.minus(Big(sendService.feeAsSatoshi));
        const number = new Big(control.value);

        if (number.e < -8) {
            return { 'tooManyDecimals': true };
        }

        if (number.e > 10) {
            return { 'tooHighValue': true };
        }

        const amountValue = number.times(Math.pow(10, 8));

        if (amountValue.gt(maxNumberPlusFee)) {
            return { 'tooHighAmount': true };
        }

        return null;
    };
}

function isEmpty(value: any): boolean {
    return value == null ||
        ((typeof value === 'string' || Array.isArray(value)) && value.length === 0);
}