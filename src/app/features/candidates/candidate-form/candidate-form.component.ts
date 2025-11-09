import { Component, OnInit, inject, Input, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { Observable, of, EMPTY } from 'rxjs';
import {
  catchError,
  finalize,
  first,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';

import { MaterialModule } from '../../../shared/material.module';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { PlacesAutocompleteDirective } from '../../../shared/directives/places-autocomplete.directive';
import { fullNameValidator } from '../../../core/validators/full-name.validator';
import { NormalizeFullNameDirective } from '../../../shared/directives/normalize-full-name.directive';

import { CandidateService } from '../../../core/services/candidate.service';
import { Candidate } from '../../../core/models/candidate.model';
import { Timestamp } from 'firebase/firestore';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TrimInputDirective } from '../../../shared/directives/trim.directive';

const EDIT_WINDOW_DAYS = 3;
const DIFF_KEYS: (keyof Candidate)[] = [
  'fullName',
  'email',
  'phone',
  'age',
  'city',
  'hobbies',
  'perfectCandidateReason',
];

@Component({
  selector: 'app-candidate-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    PlacesAutocompleteDirective,
    NormalizeFullNameDirective,
    TrimInputDirective,
  ],
  templateUrl: './candidate-form.component.html',
  styleUrls: ['./candidate-form.component.css'],
})
export class CandidateFormComponent implements OnInit {
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
  private location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

  private originalCandidate: Candidate | null = null;
  private allowedFileFormat = ['image/png', 'image/jpeg', 'image/jpg'];
  private maxFileSize = 5 * 1024 * 1024;
  private originalSnapshot!: Readonly<Partial<Candidate>>;

  get hasChanges(): boolean {
    if (!this.isEditMode) return true;
    if (!this.originalSnapshot) return true;
    if (this.imageFile) return true;

    const curr = this.snapshot();
    for (const k of DIFF_KEYS) {
      if ((curr as any)?.[k] !== (this.originalSnapshot as any)?.[k])
        return true;
    }
    return false;
  }

  ngOnInit(): void {
    this.isEditMode = !!this.id;
    this.initForm();

    if (this.isEditMode && this.id) {
      this.isLoading = true;

      this.candidateService
        .getCandidateById(this.id)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          first(),
          tap((candidate) => {
            if (!candidate) throw new Error('not-found');

            this.originalCandidate = candidate;
            this.candidateForm.patchValue(candidate);
            this.existingProfileImageUrl = candidate.profileImageUrl || null;
            this.originalSnapshot = Object.freeze(this.snapshot());

            const reg = candidate.registrationDate ?? null;
            const regMillis = this.toMillisSafe(reg);
            if (regMillis) {
              const until = new Date(regMillis);
              until.setDate(until.getDate() + EDIT_WINDOW_DAYS);
              this.editUntil = until;
              this.canEdit = Date.now() <= until.getTime();
              if (!this.canEdit)
                this.candidateForm.disable({ emitEvent: false });
            } else {
              this.canEdit = true;
            }
          }),
          catchError(() => {
            this.location.back();
            return EMPTY;
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe();
    }
  }

  private initForm(): void {
    this.candidateForm = this.fb.group({
      fullName: ['', [Validators.required, fullNameValidator]],
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

  private normStr(v: unknown): string {
    return (typeof v === 'string' ? v.trim() : '') || '';
  }

  private toMillisSafe(v: unknown): number | null {
    if (!v) return null;
    if (v instanceof Date) return v.getTime();
    if (v instanceof Timestamp) return v.toMillis();
    if (typeof v === 'number') return v;
    const d = new Date(v as any);
    return isNaN(d.getTime()) ? null : d.getTime();
  }

  private snapshot(): Partial<Candidate> {
    const raw = this.candidateForm.getRawValue() as Partial<Candidate>;
    return {
      fullName: this.normStr(raw.fullName),
      email: this.normStr(raw.email),
      phone: this.normStr(raw.phone),
      age: raw.age,
      city: this.normStr(raw.city),
      hobbies: this.normStr(raw.hobbies),
      perfectCandidateReason: this.normStr(raw.perfectCandidateReason),
    };
  }

  private buildDiff(current: Partial<Candidate>): Partial<Candidate> {
    const diff: Partial<Candidate> = {};
    for (const k of DIFF_KEYS) {
      const currVal = (current as any)?.[k];
      const origVal = (this.originalSnapshot as any)?.[k];
      if (currVal !== origVal) (diff as any)[k] = currVal;
    }
    return diff;
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
    if (this.candidateForm.invalid) {
      this.candidateForm.markAllAsTouched();
      return;
    }

    if (this.isEditMode && !this.canEdit) {
      alert(
        `The 3-day edit window expired${
          this.editUntil ? ` on ${this.editUntil.toLocaleString()}` : ''
        }.`
      );
      return;
    }

    if (this.isEditMode && !this.hasChanges) {
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
          const now = new Date();

          if (this.isEditMode && this.id) {
            const curr = this.snapshot();
            const diff = this.buildDiff(curr);
            if (imageUrl) diff.profileImageUrl = imageUrl;
            diff.lastUpdated = now;

            if (Object.keys(diff).length === 0) return EMPTY;
            return this.candidateService.updateCandidate(this.id, diff);
          }

          const v = this.candidateForm.value as Partial<Candidate>;
          const addData: Candidate = {
            fullName: this.normStr(v.fullName),
            email: this.normStr(v.email),
            phone: this.normStr(v.phone),
            age: v.age as number,
            city: this.normStr(v.city),
            hobbies: this.normStr(v.hobbies),
            perfectCandidateReason: this.normStr(v.perfectCandidateReason),
            profileImageUrl: imageUrl ?? this.existingProfileImageUrl ?? '',
            registrationDate: now,
            lastUpdated: now,
          } as Candidate;

          return this.candidateService.addCandidate(addData);
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
        }),
        catchError(() => {
          this.location.back();
          return EMPTY;
        })
      )
      .subscribe({
        next: () => {
          if (!this.isEditMode) {
            try {
              this.analyticsService.incrementRegistrations();
            } catch {}
          }
          this.location.back();
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
    if (lastTab) {
      sessionStorage.setItem('iisa_dashboard_active_tab', lastTab);
    }

    this.location.back();
  }
}
