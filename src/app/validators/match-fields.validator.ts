import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function matchFieldsValidator(
  leftField: string,
  rightField: string,
  errorKey = 'fieldsMismatch',
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control as any;
    const left = group?.get?.(leftField);
    const right = group?.get?.(rightField);
    if (!left || !right) return null;

    const leftValue = left.value;
    const rightValue = right.value;

    if (!leftValue || !rightValue) return null;
    return leftValue === rightValue ? null : { [errorKey]: true };
  };
}

