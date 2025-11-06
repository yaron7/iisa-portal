import { Component, OnInit, OnDestroy, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';

import { Subject, Observable, of } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';

import { Candidate } from '../../../core/models/candidate.model';
import { CandidateService } from '../../../core/services/candidate.service';
import { MaterialModule } from '../../../shared/material.module';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { PlacesAutocompleteDirective } from '../../../shared/directives/places-autocomplete.directive';
import { fullNameValidator } from '../../../core/validators/full-name.validator';
import { NormalizeFullNameDirective } from '../../../shared/directives/normalize-full-name.directive';

const EDIT_WINDOW_DAYS = 3;

@Component({
  selector: 'app-candidate-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    PlacesAutocompleteDirective,
    NormalizeFullNameDirective,
  ],
  templateUrl: './candidate-form.component.html',
  styleUrls: ['./candidate-form.component.css'],
})
export class CandidateFormComponent implements OnInit, OnDestroy {
  @Input() id: string | null = null;

  candidateForm!: FormGroup;
  imageFile: File | null = null;
  imagePreview: string | null = null;
  existingProfileImageUrl: string | null = null;

  isEditMode = false;
  isLoading = false;

  canEdit = true;
  editUntil?: Date;

  private candidateService = inject(CandidateService);
  private analyticsService = inject(AnalyticsService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private originalCandidate: Candidate | null = null;
  private allowedFileFormat = ['image/png', 'image/jpeg', 'image/jpg'];
  private maxFileSize = 5 * 1024 * 1024;

  ngOnInit(): void {
    this.isEditMode = !!this.id;
    this.initForm();

    if (this.isEditMode && this.id) {
      this.isLoading = true;
      this.candidateService
        .getCandidateById(this.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (candidate) => {
            if (candidate) {
              this.originalCandidate = candidate;
              this.candidateForm.patchValue(candidate);
              this.existingProfileImageUrl = candidate.profileImageUrl || null;

              const reg = candidate.registrationDate
                ? new Date(candidate.registrationDate as any)
                : null;

              if (reg) {
                const until = new Date(reg);
                until.setDate(until.getDate() + EDIT_WINDOW_DAYS);
                this.editUntil = until;
                this.canEdit = new Date() <= until;
                if (!this.canEdit) this.candidateForm.disable();
              } else {
                this.canEdit = true;
              }
            } else {
              this.router.navigate(['/dashboard']);
            }
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
            this.router.navigate(['/dashboard']);
          },
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.candidateForm = this.fb.group({
      fullName: ['', Validators.required, fullNameValidator],
      email: ['', [Validators.required, Validators.email]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^0(?:[23489]\d{7}|5\d{8})$/)],
      ],
      age: [
        null,
        [Validators.required, Validators.min(18), Validators.max(99)],
      ],
      city: ['', Validators.required],
      cityLat: [null],
      cityLng: [null],
      hobbies: [''],
      perfectCandidateReason: ['', Validators.required],
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] || null;
    if (!file) return;
    if (!this.allowedFileFormat.includes(file.type)) return;
    if (file.size > this.maxFileSize) return;

    this.imageFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.isEditMode && !this.canEdit) {
      alert(
        `The 3-day edit window expired${
          this.editUntil ? ` on ${this.editUntil.toLocaleString()}` : ''
        }.`
      );
      return;
    }

    if (this.candidateForm.invalid) {
      this.candidateForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const fileUpload$: Observable<string | null> = this.imageFile
      ? this.candidateService
          .uploadProfileImage(this.imageFile)
          .pipe(map((url) => url as string))
      : of(this.existingProfileImageUrl);

    fileUpload$
      .pipe(
        switchMap((imageUrl) => {
          const formValues = this.candidateForm.value;
          const now = new Date();

          const candidateData: Candidate = {
            ...this.originalCandidate,
            ...formValues,
            profileImageUrl: imageUrl || '',
            lastUpdated: now,
            registrationDate: this.isEditMode
              ? this.originalCandidate?.registrationDate
              : now,
          };

          if (this.isEditMode && this.id) {
            const { id, ...updateData } = candidateData as any;
            return this.candidateService.updateCandidate(this.id, updateData);
          } else {
            const { id, ...addData } = candidateData as any;
            return this.candidateService.addCandidate(addData);
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          // Increment analytics only on initial registration
          if (!this.isEditMode) {
            try {
              this.analyticsService.incrementRegistrations();
            } catch {}
          }
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  onCitySelected(e: {
    city: string;
    lat: number | null;
    lng: number | null;
    formattedAddress: string;
  }) {
    this.candidateForm.patchValue({
      city: e.city || e.formattedAddress,
      cityLat: e.lat,
      cityLng: e.lng,
    });
  }

  onCancel(): void {
    const lastTab = sessionStorage.getItem('iisa_dashboard_active_tab');
    this.router.navigate(['/dashboard']).then(() => {
      if (lastTab) {
        sessionStorage.setItem('iisa_dashboard_active_tab', lastTab);
      }
    });
  }
}
