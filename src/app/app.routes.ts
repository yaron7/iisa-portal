import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
    title: 'IISA - Join the Space Race',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
    title: 'Admin Login',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authGuard],
    title: 'IISA Admin Dashboard',
  },
  {
    path: 'candidates/add',
    loadComponent: () =>
      import(
        './features/candidates/candidate-form/candidate-form.component'
      ).then((m) => m.CandidateFormComponent),
    canActivate: [authGuard],
    title: 'Add New Candidate',
  },
  {
    path: 'candidates/edit/:id',
    loadComponent: () =>
      import(
        './features/candidates/candidate-form/candidate-form.component'
      ).then((m) => m.CandidateFormComponent),
    canActivate: [authGuard],
    title: 'Edit Candidate',
  },
  {
    path: 'candidates/:id',
    loadComponent: () =>
      import(
        './features/candidates/candidate-details/candidate-details.component'
      ).then((m) => m.CandidateDetailsComponent),
    canActivate: [authGuard],
    title: 'Candidate Details',
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
