import { Component, Optional, AfterContentInit } from '@angular/core';
import { AbstractControl } from '@angular/forms'; // No longer need FormControlDirective
import { CommonModule } from '@angular/common';
import {
  MatFormField,
  MatFormFieldModule,
  MatError,
} from '@angular/material/form-field'; // Import MatFormField

// This map holds all possible error messages for the entire application
const VALIDATION_MESSAGES: { [key: string]: (args?: any) => string } = {
  required: () => 'This field is <strong>required</strong>',
  email: () => 'Please enter a valid email address',
  minlength: (args) =>
    `Must be at least <strong>${args.requiredLength}</strong> characters`,
  min: (args) => `Value must be at least <strong>${args.min}</strong>`,
  max: (args) => `Value cannot be more than <strong>${args.max}</strong>`,
};

@Component({
  selector: 'form-validation-errors',
  standalone: true,
  // Make sure MatError is imported and available in imports for <mat-error> to work
  imports: [CommonModule, MatFormFieldModule, MatError],
  template: `
    @if (errorMessage) {
    <mat-error [innerHTML]="errorMessage"></mat-error>
    }
  `,
  styleUrls: [],
})
export class FormValidationErrorsComponent implements AfterContentInit {
  // Implement OnInit

  private _control: AbstractControl | null = null; // Private field to hold the control

  constructor(@Optional() private matFormField: MatFormField) {}

  // 2. Use ngAfterContentInit
  // This hook fires AFTER the parent (MatFormField) has processed its content (the <input>)
  ngAfterContentInit(): void {
    if (
      this.matFormField &&
      this.matFormField._control &&
      this.matFormField._control.ngControl
    ) {
      // Now it's safe to access the control
      this._control = this.matFormField._control.ngControl.control;
    }
  }

  get control(): AbstractControl | null {
    return this._control;
  }

  get errorMessage(): string | null {
    // Only show errors if the control exists, has errors, and has been touched or is dirty
    if (
      !this.control ||
      !this.control.errors ||
      (!this.control.touched && !this.control.dirty)
    ) {
      return null;
    }

    const errorKeys = Object.keys(this.control.errors);

    for (const key of errorKeys) {
      if (VALIDATION_MESSAGES[key]) {
        const errorDetails = this.control.errors[key];
        return VALIDATION_MESSAGES[key](errorDetails);
      }
    }

    return null;
  }
}
