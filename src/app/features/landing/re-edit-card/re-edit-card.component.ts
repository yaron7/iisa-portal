import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-re-edit-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  styleUrls: ['./re-edit-card.component.css'],
  template: `
    <mat-card class="re-edit-card">
      <mat-card-header>
        <mat-icon mat-card-avatar color="accent">history</mat-icon>
        <mat-card-title>Welcome Back, Applicant!</mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <p>
          You have an existing application in progress. You can edit it until:
        </p>
        <p class="expiry-date">
          {{ reEditExpiresDate | date : 'fullDate' }} at
          {{ reEditExpiresDate | date : 'shortTime' }}
        </p>
      </mat-card-content>

      <mat-card-actions
        class="d-flex justify-content-between"
        style="margin-top:1rem;"
      >
        <button mat-button (click)="beginApplication.emit()">
          Start a New Application
        </button>
        <button
          mat-flat-button
          color="accent"
          (click)="editMySubmission.emit()"
        >
          <mat-icon>edit</mat-icon> Edit My Application
        </button>
      </mat-card-actions>
    </mat-card>
  `,
})
export class ReEditCardComponent {
  @Input() reEditExpiresDate!: Date | null;
  @Output() beginApplication = new EventEmitter<void>();
  @Output() editMySubmission = new EventEmitter<void>();
}
