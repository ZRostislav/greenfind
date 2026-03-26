import { FormControl, FormGroup } from '@angular/forms';
import { matchFieldsValidator } from './match-fields.validator';

describe('matchFieldsValidator', () => {
  it('returns null when fields match', () => {
    const form = new FormGroup(
      {
        password: new FormControl('SameValue1'),
        confirmPassword: new FormControl('SameValue1'),
      },
      { validators: matchFieldsValidator('password', 'confirmPassword') },
    );

    expect(form.errors).toBeNull();
  });

  it('returns mismatch error when fields do not match', () => {
    const form = new FormGroup(
      {
        password: new FormControl('ValueOne1'),
        confirmPassword: new FormControl('ValueTwo2'),
      },
      { validators: matchFieldsValidator('password', 'confirmPassword') },
    );

    expect(form.errors).toEqual({ fieldsMismatch: true });
  });

  it('supports custom error key', () => {
    const validator = matchFieldsValidator('left', 'right', 'passwordMismatch');
    const form = new FormGroup({
      left: new FormControl('abc'),
      right: new FormControl('xyz'),
    });

    expect(validator(form)).toEqual({ passwordMismatch: true });
  });

  it('returns null if one field is missing', () => {
    const validator = matchFieldsValidator('left', 'right');
    const form = new FormGroup({
      left: new FormControl('abc'),
    });

    expect(validator(form)).toBeNull();
  });
});
