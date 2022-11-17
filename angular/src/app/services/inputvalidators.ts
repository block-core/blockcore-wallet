import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import Big from 'big.js';
import { Network } from 'src/shared/networks';
import { AddressValidationService } from './address-validation.service';
import { SendService } from './send.service';
import { SendSidechainService } from './send-sidechain.service';

export class InputValidators {
  static maximumBitcoin(sendService: SendService): ValidatorFn {
    return maxBitcoinValidator(sendService);
  }

  static address(sendService: SendService, addressValidation: AddressValidationService): ValidatorFn {
    return addressValidator(sendService, addressValidation);
  }

  static maxBytes(maxLength: number): ValidatorFn {
    return bytesValidator(maxLength);
  }

  static addressSidechain(sendSidechainService: SendSidechainService, addressValidation: AddressValidationService): ValidatorFn {
    return addressSidechainValidator(sendSidechainService, addressValidation);
  }
}

export function bytesValidator(maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    try {
      // If there are no value, we'll skip validation and allow this input.
      if (!control.value) {
        return null;
      }

      var enc = new TextEncoder();
      var arr = enc.encode(control.value);

      if (arr.length < maxLength) {
        return null;
      } else {
        return {
          maxbytes: {
            requiredLength: 80,
            actualLength: arr.length,
          },
        };
      }
    } catch (err) {
      return {
        maxbytes: {
          requiredLength: 80,
          actualLength: 'Error',
        },
        error: err,
      };
    }
  };
}

export function maxBitcoinValidator(sendService: SendService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    let max = sendService.accountHistory.balance;

    if (isEmpty(control.value) || isEmpty(max)) {
      return null;
    }

    let maxNumber = Big(max);
    const number = new Big(control.value);

    if (number.e < -8) {
      return { tooManyDecimals: true };
    }

    if (number.e > 10) {
      return { tooHighValue: true };
    }

    const amountValue = number.times(Math.pow(10, 8));

    if (amountValue.gt(maxNumber)) {
      return { tooHighAmount: true };
    }

    return null;
  };
}

export function addressValidator(sendService: SendService, addressValidation: AddressValidationService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    try {
      // If there are no value, we'll skip validation and allow this input.
      if (!control.value) {
        return null;
      }

      const result = addressValidation.validateByNetwork(control.value, sendService.network);

      console.log('VALIDATION RESULT:', result);
      console.log('NETWORK:', sendService.network);

      if (result) {
        return null;
      } else {
        return { invalid: true };
      }
    } catch (err) {
      return { invalid: true, error: err };
    }
  };
}

export function addressSidechainValidator(sendSidechainService: SendSidechainService, addressValidation: AddressValidationService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    try {
      // If there are no value, we'll skip validation and allow this input.
      if (!control.value) {
        return null;
      }

      const result = addressValidation.validateByNetwork(control.value, sendSidechainService.network);

      console.log('VALIDATION RESULT:', result);
      console.log('NETWORK:', sendSidechainService.network);

      if (result) {
        return null;
      } else {
        return { invalid: true };
      }
    } catch (err) {
      return { invalid: true, error: err };
    }
  };
}

function isEmpty(value: any): boolean {
  return value == null || ((typeof value === 'string' || Array.isArray(value)) && value.length === 0);
}
