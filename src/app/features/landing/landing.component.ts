import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AnalyticsService } from '../../core/services/analytics.service';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import { Subscription, Subject, switchMap, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DocumentReference } from '@angular/fire/firestore';
import { MaterialModule } from '../../shared/material.module';
import { PlacesAutocompleteDirective } from '../../shared/directives/places-autocomplete.directive';
import { fullNameValidator } from '../../core/validators/full-name.validator';
import { NormalizeFullNameDirective } from '../../shared/directives/normalize-full-name.directive';
import { CandidateService } from '../../core/services/candidate.service';
import { Candidate } from '../../core/models/candidate.model';
import { ThankYouCardComponent } from './thank-you-card/thank-you-card.component';
import { ReEditCardComponent } from './re-edit-card/re-edit-card.component';

const EDIT_WINDOW_DAYS = 3;

@Component({
  selector: 'iisa-landing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    ThankYouCardComponent,
    ReEditCardComponent,
    PlacesAutocompleteDirective,
    NormalizeFullNameDirective,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
  animations: [
    trigger('formFade', [
      state(
        'hidden',
        style({
          opacity: 0,
          transform: 'translateY(20px)',
          'pointer-events': 'none',
        })
      ),
      state(
        'visible',
        style({
          opacity: 1,
          transform: 'translateY(0)',
          'pointer-events': 'auto',
        })
      ),
      transition('hidden <=> visible', [animate('600ms ease-out')]),
      transition('void => visible', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out'),
      ]),
    ]),
  ],
})
export class LandingComponent implements OnInit, OnDestroy {
  personalInfoForm: FormGroup;
  freeTextForm: FormGroup;
  imageForm: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  isSubmitting = false;
  submissionSuccess = false;
  formState: 'hidden' | 'visible' = 'hidden';
  personalFields = [
    { name: 'fullName', label: 'Full Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'age', label: 'Age', type: 'number' },
  ];

  // --- Re-editing Properties ---
  canReEdit: boolean = false;
  reEditCandidateId: string | null = null;
  reEditExpiresDate: Date | null = null;
  hideReEditCard: boolean = false;

  private routerSubscription: Subscription | undefined;
  private destroy$ = new Subject<void>();

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private candidateService = inject(CandidateService);
  private analyticsService = inject(AnalyticsService);

  constructor() {
    this.personalInfoForm = this.fb.group({
      fullName: ['', [Validators.required, fullNameValidator]],
      email: ['', [Validators.required, Validators.email]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^0(?:[23489]\d{7}|5\d{8})$/)],
      ],
      age: [
        null,
        [Validators.required, Validators.min(18), Validators.max(100)],
      ],
      city: ['', Validators.required],
      cityLat: [null],
      cityLng: [null],
    });

    this.freeTextForm = this.fb.group({
      hobbies: [''],
      perfectCandidateReason: [
        '',
        [Validators.required, Validators.maxLength(1000)],
      ],
    });

    this.imageForm = this.fb.group({
      profileImage: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.analyticsService.incrementVisits();
    this.checkReEditEligibility();

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        if ((event as NavigationEnd).urlAfterRedirects === '/') {
          this.resetState();
          this.checkReEditEligibility();
        }
      });
  }

  private checkReEditEligibility(): void {
    const storedCandidateId = localStorage.getItem('iisa_candidate_id');
    const storedRegistrationDateStr = localStorage.getItem(
      'iisa_registration_date'
    );

    if (storedCandidateId && storedRegistrationDateStr) {
      const registrationDate = new Date(storedRegistrationDateStr);
      const threeDaysLater = new Date(registrationDate);
      threeDaysLater.setDate(registrationDate.getDate() + EDIT_WINDOW_DAYS);

      const now = new Date();

      if (now < threeDaysLater) {
        this.canReEdit = true;
        this.reEditCandidateId = storedCandidateId;
        this.reEditExpiresDate = threeDaysLater;
      } else {
        localStorage.removeItem('iisa_candidate_id');
        localStorage.removeItem('iisa_registration_date');
        this.canReEdit = false;
      }
    } else {
      this.canReEdit = false;
    }
    this.hideReEditCard = false;
  }

  resetState(): void {
    this.formState = 'hidden';
    this.submissionSuccess = false;
    this.isSubmitting = false;
    this.imagePreview = null;
    this.selectedFile = null;
    this.personalInfoForm.reset();
    this.freeTextForm.reset();
    this.imageForm.reset();
    this.hideReEditCard = false;
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  beginApplication(): void {
    this.formState = 'visible';
    this.hideReEditCard = true;
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
      this.imageForm.patchValue({ profileImage: file });

      const reader = new FileReader();
      reader.onload = () => (this.imagePreview = reader.result);
      reader.readAsDataURL(file);
    }
  }

  onCitySelected(e: {
    city: string;
    lat: number | null;
    lng: number | null;
    formattedAddress: string;
  }) {
    this.personalInfoForm.patchValue({
      city: e.city || e.formattedAddress,
      cityLat: e.lat,
      cityLng: e.lng,
    });
  }

  onSubmit(): void {
    if (
      !this.personalInfoForm.valid ||
      !this.freeTextForm.valid ||
      !this.imageForm.valid ||
      !this.selectedFile
    ) {
      this.personalInfoForm.markAllAsTouched();
      this.freeTextForm.markAllAsTouched();
      this.imageForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.candidateService
      .uploadProfileImage(this.selectedFile)
      .pipe(
        switchMap((imageUrl) => {
          const { id, ...finalData } = {
            ...this.personalInfoForm.value,
            ...this.freeTextForm.value,
            profileImageUrl: imageUrl,
            registrationDate: new Date(),
            lastUpdated: new Date(),
          } as Candidate;

          return this.candidateService.addCandidate(finalData);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (docRef: DocumentReference) => {
          this.submissionSuccess = true;
          this.isSubmitting = false;
          this.analyticsService.incrementRegistrations();

          if (docRef && docRef.id) {
            const newCandidateIdString = docRef.id;
            localStorage.setItem('iisa_candidate_id', newCandidateIdString);
            const regDate = new Date();
            localStorage.setItem(
              'iisa_registration_date',
              regDate.toISOString()
            );

            this.reEditCandidateId = newCandidateIdString;
            const expires = new Date(regDate);
            expires.setDate(expires.getDate() + EDIT_WINDOW_DAYS);
            this.reEditExpiresDate = expires;
            this.canReEdit = true;
            this.hideReEditCard = false;
          }
        },
        error: (err) => {
          console.error('Submission failed', err);
          this.isSubmitting = false;
        },
      });
  }

  editMySubmission(): void {
    if (this.reEditCandidateId) {
      this.router.navigate(['/candidates/edit', this.reEditCandidateId], {
        state: { source: 'landing', returnUrl: this.router.url },
      });
    }
  }
}
