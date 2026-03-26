import { FormControl } from '@angular/forms';
import {
  passwordHasDigit,
  passwordHasLowercase,
  passwordHasUppercase,
  passwordPolicyValidator,
} from './password-policy.validator';

describe('passwordPolicyValidator', () => {
  it('returns null for empty value', () => {
    const control = new FormControl('');
    expect(passwordPolicyValidator(control)).toBeNull();
  });

  it('returns null for valid password', () => {
    const control = new FormControl('StrongPass123');
    expect(passwordPolicyValidator(control)).toBeNull();
  });

  it('returns detailed flags for invalid password', () => {
    const control = new FormControl('onlylower');
    expect(passwordPolicyValidator(control)).toEqual({
      passwordPolicy: {
        missingUppercase: true,
        missingLowercase: false,
        missingDigit: true,
      },
    });
  });
});

describe('password policy helpers', () => {
  it('passwordHasUppercase works correctly', () => {
    expect(passwordHasUppercase('abc')).toBeFalse();
    expect(passwordHasUppercase('aBc')).toBeTrue();
  });

  it('passwordHasLowercase works correctly', () => {
    expect(passwordHasLowercase('ABC')).toBeFalse();
    expect(passwordHasLowercase('AbC')).toBeTrue();
  });

  it('passwordHasDigit works correctly', () => {
    expect(passwordHasDigit('abc')).toBeFalse();
    expect(passwordHasDigit('abc2')).toBeTrue();
  });
});
