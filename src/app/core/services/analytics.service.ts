import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  DocumentReference,
  DocumentData,
  increment,
  setDoc,
  docData,
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AnalyticsData {
  totalVisits: number;
  totalRegistrations: number;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private firestore: Firestore = inject(Firestore);

  // Define the path to our single analytics document
  private analyticsDocRef: DocumentReference<DocumentData>;
  private docPath = 'analytics/siteStats'; // Single doc for all stats

  constructor() {
    this.analyticsDocRef = doc(this.firestore, this.docPath);
  }

  /**
   * Increments the total page visits counter in Firestore.
   * Uses 'increment' for safe concurrent updates.
   */
  public incrementVisits(): void {
    // setDoc with merge:true will create the doc if it doesn't exist,
    // and increment will create the field if it doesn't exist.
    from(
      setDoc(
        this.analyticsDocRef,
        {
          totalVisits: increment(1),
        },
        { merge: true }
      )
    ).subscribe({
      next: () => console.log('Visit tracked'),
      error: (err) => console.error('Error tracking visit:', err),
    });
  }

  /**
   * Increments the total registrations counter in Firestore.
   */
  public incrementRegistrations(): void {
    from(
      setDoc(
        this.analyticsDocRef,
        {
          totalRegistrations: increment(1),
        },
        { merge: true }
      )
    ).subscribe({
      next: () => console.log('Registration tracked'),
      error: (err) => console.error('Error tracking registration:', err),
    });
  }

  /**
   * Gets the LIVE analytics data from Firestore.
   * @returns An observable of the AnalyticsData object.
   */
  public getAnalyticsData(): Observable<AnalyticsData> {
    // docData provides live updates
    return docData(this.analyticsDocRef).pipe(
      map((data) => {
        if (data) {
          return {
            totalVisits: data['totalVisits'] || 0,
            totalRegistrations: data['totalRegistrations'] || 0,
          };
        } else {
          // Return default object if the document doesn't exist yet
          return { totalVisits: 0, totalRegistrations: 0 };
        }
      })
    );
  }
}
