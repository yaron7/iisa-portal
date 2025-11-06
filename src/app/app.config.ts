import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withRouterConfig,
  withComponentInputBinding,
} from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from './environments/environment';

// --- Firebase providers ---
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { GoogleMapsLoaderService } from './core/services/google-maps-loader.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // --- Angular Core providers ---
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withRouterConfig({
        onSameUrlNavigation: 'reload',
      }),
      withComponentInputBinding()
    ),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),

    // --- Firebase providers ---
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideAuth(() => getAuth()),

    // --- Google Maps Configuration ---
    provideAppInitializer(() => inject(GoogleMapsLoaderService).load()),
  ],
};
