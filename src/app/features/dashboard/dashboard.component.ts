import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, forkJoin } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';

import { CandidateService } from '../../core/services/candidate.service';
import { Candidate } from '../../core/models/candidate.model';

import { GoogleMap, MapMarker } from '@angular/google-maps';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

import { CandidatesListComponent } from '../candidates/candidate-list/candidates-list.component';
import { AuthService } from '../../core/auth/auth.service';
import { GeocodingService } from '../../core/services/geocoding.service';
import { CandidateNavService } from '../../core/services/candidate-nav.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { MaterialModule } from '../../shared/material.module';

@Component({
  selector: 'iisa-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgxChartsModule,
    GoogleMap,
    MapMarker,
    CandidatesListComponent,
    MaterialModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(GoogleMap) googleMap?: GoogleMap;

  candidates$: Observable<Candidate[]>;
  candidates: Candidate[] = [];
  private destroy$ = new Subject<void>();
  activeTabIndex = 0;

  isLoadingData = true;
  Math = Math;

  // ----- Charts/KPIs -----
  ageBreakdownData: { name: string; value: number }[] = [];
  cityDistributionData: { name: string; value: number }[] = [];
  conversionData: { name: string; value: number }[] = [];

  colorScheme: Color = {
    domain: ['#a0c0ff', '#4185f4', '#f7e733', '#ff6f6f', '#8B008B', '#5AA454'],
    group: ScaleType.Ordinal,
    selectable: true,
    name: 'IISA Scheme',
  };

  // ----- Map -----
  mapCenter: google.maps.LatLngLiteral = { lat: 31.7683, lng: 35.2137 };
  mapZoom = 8;
  markerPositions: google.maps.LatLngLiteral[] = [];
  markerOptions: google.maps.MarkerOptions = { draggable: false };

  private candidateService = inject(CandidateService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private geocodingService = inject(GeocodingService);
  private candidateNavService = inject(CandidateNavService);
  private analyticsService = inject(AnalyticsService);

  constructor() {
    this.candidates$ = this.candidateService.getAllCandidates();
  }

  ngOnInit(): void {
    const storedTab = sessionStorage.getItem('iisa_dashboard_active_tab');
    this.activeTabIndex = storedTab ? Number(storedTab) : 0;

    this.candidates$.pipe(takeUntil(this.destroy$)).subscribe((candidates) => {
      this.candidates = candidates || [];
      this.processAnalytics(this.candidates);
      this.isLoadingData = false;

      const navItems = (this.candidates || [])
        .filter((c) => !!c?.id)
        .map((c) => ({ id: String(c.id) }));
      this.candidateNavService.setList(navItems);
    });

    this.analyticsService
      .getAnalyticsData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ totalVisits, totalRegistrations }) => {
        this.conversionData = [
          { name: 'Visits', value: totalVisits || 0 },
          { name: 'Registrations', value: totalRegistrations || 0 },
        ];
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- Analytics helpers ----------
  private safeGetVisitsCount(): number {
    try {
      if (typeof (this.analyticsService as any).getVisitsCount === 'function') {
        return (this.analyticsService as any).getVisitsCount();
      }
      const raw = localStorage.getItem('iisa_visits_count');
      return raw ? Number(raw) || 0 : 0;
    } catch {
      return 0;
    }
  }

  private safeGetRegistrationsCount(): number {
    try {
      if (
        typeof (this.analyticsService as any).getRegistrationsCount ===
        'function'
      ) {
        return (this.analyticsService as any).getRegistrationsCount();
      }
      const raw = localStorage.getItem('iisa_registrations_count');
      return raw ? Number(raw) || 0 : 0;
    } catch {
      return 0;
    }
  }

  // ---------- Process charts & map ----------
  processAnalytics(candidates: Candidate[]): void {
    const groups: Record<string, number> = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46+': 0,
    };
    for (const c of candidates) {
      const age = Number(c.age) || 0;
      if (age <= 25) groups['18-25']++;
      else if (age <= 35) groups['26-35']++;
      else if (age <= 45) groups['36-45']++;
      else groups['46+']++;
    }
    this.ageBreakdownData = Object.entries(groups).map(([name, value]) => ({
      name,
      value,
    }));

    const cityCounts = new Map<string, number>();
    candidates.forEach((c) => {
      const key = (c.city || '').toString().trim();
      if (!key) return;
      cityCounts.set(key, (cityCounts.get(key) || 0) + 1);
    });
    const sorted = Array.from(cityCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7) // Top 7
      .map(([name, value]) => ({ name, value }));
    this.cityDistributionData = sorted;

    const uniqueCities = Array.from(cityCounts.keys());
    if (uniqueCities.length === 0) {
      this.markerPositions = [];
      this.fitMapToMarkers();
      return;
    }
    const lookups = uniqueCities.map((city) =>
      this.geocodingService.getCoordinates(city).pipe(map((coords) => coords))
    );
    forkJoin(lookups)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (coordsList) => {
          this.markerPositions = coordsList.filter(
            (p): p is google.maps.LatLngLiteral => !!p
          );
          this.fitMapToMarkers();
        },
        error: () => {
          this.markerPositions = [];
          this.fitMapToMarkers();
        },
      });
  }

  fitMapToMarkers(): void {
    const gmap = this.googleMap?.googleMap;
    if (!gmap) return;

    if (this.markerPositions.length === 1) {
      this.mapCenter = this.markerPositions[0];
      gmap.setCenter(this.mapCenter);
      gmap.setZoom(10);
      return;
    }
    if (this.markerPositions.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      this.markerPositions.forEach((p) => bounds.extend(p));
      gmap.fitBounds(bounds, 48);
      return;
    }
    gmap.setCenter(this.mapCenter);
    gmap.setZoom(this.mapZoom);
  }

  // ---------- Actions ----------
  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  onTabChange(index: number) {
    this.activeTabIndex = index;
    sessionStorage.setItem('iisa_dashboard_active_tab', index.toString());
  }

  onViewCandidate(candidateId: string): void {
    this.router.navigate(['/candidates', candidateId]);
  }

  onEditCandidate(candidateId: string): void {
    this.router.navigate(['/candidates/edit', candidateId]);
  }

  onAddCandidate(): void {
    this.router.navigate(['/candidates/add']);
  }

  onDeleteCandidate(candidateId: string): void {
    if (
      confirm(
        'Are you sure you want to delete this candidate? This action cannot be undone.'
      )
    ) {
      this.candidateService.deleteCandidate(candidateId).subscribe({
        next: () => {},
        error: (err) => console.error('Error deleting candidate:', err),
      });
    }
  }

  onFocusCandidate(candidate: Candidate): void {
    const city = (candidate?.city || '').toString().trim();
    if (!city) return;

    this.geocodingService
      .getCoordinates(city)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (coords) => {
          if (!coords) return;
          this.mapCenter = coords;
          const gmap = this.googleMap?.googleMap;
          if (gmap) {
            gmap.panTo(coords);
            gmap.setZoom(11); 
          }
        },
        error: () => {
        },
      });
  }
}
