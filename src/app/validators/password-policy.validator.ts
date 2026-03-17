import { AbstractControl, ValidationErrors } from '@angular/forms';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export function passwordPolicyValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value || '').trim();
  if (!value) return null;

  const missingUppercase = !/[A-Z]/.test(value);
  const missingLowercase = !/[a-z]/.test(value);
  const missingDigit = !/[0-9]/.test(value);

  if (!missingUppercase && !missingLowercase && !missingDigit) return null;
  return {
    passwordPolicy: {
      missingUppercase,
      missingLowercase,
      missingDigit,
    },
  };
}

export function passwordHasUppercase(value: string): boolean {
  return /[A-Z]/.test(value);
}

export function passwordHasLowercase(value: string): boolean {
  return /[a-z]/.test(value);
}

export function passwordHasDigit(value: string): boolean {
  return /[0-9]/.test(value);
}

