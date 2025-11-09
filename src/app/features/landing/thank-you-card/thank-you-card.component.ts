import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-thank-you-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  styleUrls: ['./thank-you-card.component.css'],
  template: `
    <mat-card class="thank-you-card">
      <h2>APPLICATION RECEIVED</h2>
      <mat-icon class="success-icon">check_circle</mat-icon>
      <p>Thank you for your submission. We are one step closer to history.</p>

      @if (canReEdit) {
      <p class="re-edit-success-info">
        You can edit your application until
        <strong>{{ reEditExpiresDate | date : 'medium' }}</strong
        >.
      </p>
      <button mat-flat-button color="accent" (click)="editMySubmission.emit()">
        <mat-icon>edit</mat-icon> Edit My Application
      </button>
      }

      <button
        mat-button
        color="primary"
        class="return-home-btn"
        (click)="returnHome.emit()"
        style="margin-top:1rem;"
      >
        Return to Home
      </button>
    </mat-card>
  `,
})
export class ThankYouCardComponent {
  @Input() canReEdit = false;
  @Input() reEditExpiresDate!: Date | null;
  @Output() editMySubmission = new EventEmitter<void>();
  @Output() returnHome = new EventEmitter<void>();
}
