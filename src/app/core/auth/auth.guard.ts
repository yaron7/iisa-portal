import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoggedIn().pipe(
    take(1), // Take only the first emission and complete
    map((isLoggedIn) => {
      if (isLoggedIn) {
        return true; // User is logged in, allow access
      } else {
        // User is not logged in, redirect to login page
        return router.createUrlTree(['/login']);
      }
    })
  );
};
