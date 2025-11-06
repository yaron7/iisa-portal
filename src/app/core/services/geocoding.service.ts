import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, shareReplay, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private http = inject(HttpClient);
  private apiKey = environment.googleMapsApiKey || null;
  private cache = new Map<string, google.maps.LatLngLiteral | null>();
  private inFlight = new Map<
    string,
    Observable<google.maps.LatLngLiteral | null>
  >();

  getCoordinates(
    address: string
  ): Observable<google.maps.LatLngLiteral | null> {
    if (!address) return of(null);

    const key = address.toLowerCase().trim();
    if (this.cache.has(key)) return of(this.cache.get(key) || null);
    if (this.inFlight.has(key)) return this.inFlight.get(key)!;
    if (!this.apiKey) {
      this.cache.set(key, null);
      return of(null);
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${this.apiKey}`;

    const obs = this.http.get<any>(url).pipe(
      map((res) => {
        if (res?.status === 'OK' && res.results?.length) {
          const loc = res.results[0].geometry.location;
          const coords = {
            lat: loc.lat,
            lng: loc.lng,
          } as google.maps.LatLngLiteral;
          this.cache.set(key, coords);
          return coords;
        }
        this.cache.set(key, null);
        return null;
      }),
      catchError(() => {
        this.cache.set(key, null);
        return of(null);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.inFlight.set(key, obs);
    obs.subscribe({
      next: () => this.inFlight.delete(key),
      error: () => this.inFlight.delete(key),
    });

    return obs;
  }
}
