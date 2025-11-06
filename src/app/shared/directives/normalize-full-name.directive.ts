import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({ selector: '[normalizeFullName]' })
export class NormalizeFullNameDirective {
  constructor(private ngControl: NgControl) {}

  @HostListener('blur')
  onBlur() {
    const ctrl = this.ngControl.control;
    if (!ctrl) return;
    const v = (ctrl.value ?? '').toString();
    const norm = v.trim().replace(/\s+/g, ' ');
    if (v !== norm) ctrl.patchValue(norm, { emitEvent: false });
  }
}
