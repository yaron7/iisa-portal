import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const LETTER_RE =
  /^[\p{Script=Hebrew}\p{Script=Latin}]+(?:[-'][\p{Script=Hebrew}\p{Script=Latin}]+)*$/u;

export const fullNameValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const raw = typeof control.value === 'string' ? control.value : '';
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/\s+/g, ' ');
  const parts = normalized.split(' ');

  if (parts.length < 2) return { fullnameFormat: { code: 'atLeastTwoParts' } };
  if (!parts.every((p) => LETTER_RE.test(p)))
    return { fullnameFormat: { code: 'lettersOnly' } };

  return null;
};
