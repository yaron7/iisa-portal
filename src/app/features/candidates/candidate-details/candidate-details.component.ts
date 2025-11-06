import { Component, OnInit, OnDestroy, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Candidate } from '../../../core/models/candidate.model';
import { CandidateService } from '../../../core/services/candidate.service';
import { MaterialModule } from '../../../shared/material.module';
import { CandidateNavService } from '../../../core/services/candidate-nav.service';

@Component({
  selector: 'app-candidate-details',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './candidate-details.component.html',
  styleUrls: ['./candidate-details.component.css'],
})
export class CandidateDetailsComponent implements OnInit, OnDestroy {
  @Input() id!: string;
  candidate: Candidate | null = null;
  isLoading = true;

  prevId: string | null = null;
  nextId: string | null = null;
  index = -1;
  total = 0;

  private candidateService = inject(CandidateService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private candidateNav = inject(CandidateNavService);

  ngOnInit(): void {
    if (!this.id) {
      this.isLoading = false;
      this.router.navigate(['/dashboard']);
      return;
    }

    // עדכון מזהה נוכחי וחישוב שכנים
    this.candidateNav.setCurrentId(this.id);
    this.candidateNav
      .neighbors$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ prevId, nextId, index, total }) => {
        this.prevId = prevId;
        this.nextId = nextId;
        this.index = index;
        this.total = total;
      });

    // טעינת המועמד
    this.candidateService
      .getCandidateById(this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Candidate | null) => {
          if (data) {
            this.candidate = data;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  editCandidate(): void {
    this.router.navigate(['/candidates/edit', this.id]);
  }

  goPrev(): void {
    if (!this.prevId) return;
    this.router.navigate(['/candidates', this.prevId]).then(() => {
      this.id = this.prevId!;
      this.isLoading = true;
      this.candidateNav.setCurrentId(this.id);
      this.candidateService
        .getCandidateById(this.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.candidate = data;
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          },
        });
    });
  }

  goNext(): void {
    if (!this.nextId) return;
    this.router.navigate(['/candidates', this.nextId]).then(() => {
      this.id = this.nextId!;
      this.isLoading = true;
      this.candidateNav.setCurrentId(this.id);
      this.candidateService
        .getCandidateById(this.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.candidate = data;
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          },
        });
    });
  }
}
