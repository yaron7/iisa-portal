import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[trimInput]',
  standalone: true,
})
export class TrimInputDirective {
  constructor(private ngControl: NgControl) {}

  @HostListener('blur')
  onBlur() {
    const control = this.ngControl.control;
    if (control && typeof control.value === 'string') {
      const trimmed = control.value.trim();
      if (trimmed !== control.value) control.setValue(trimmed);
    }
  }
}
