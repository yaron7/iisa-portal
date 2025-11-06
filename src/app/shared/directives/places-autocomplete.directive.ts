import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  AfterViewInit,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appPlacesAutocomplete]',
  standalone: true,
})
export class PlacesAutocompleteDirective implements AfterViewInit, OnDestroy {
  @Input() country?: string[]; // e.g., ['il']  or multiple
  @Input() types?: string[]; // default: ['(cities)']
  @Output() placeSelected = new EventEmitter<{
    city: string;
    lat: number | null;
    lng: number | null;
    formattedAddress: string;
  }>();

  private autocomplete?: google.maps.places.Autocomplete;
  private listener?: google.maps.MapsEventListener;

  constructor(private el: ElementRef<HTMLInputElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    const init = () => {
      const input = this.el.nativeElement;
      const opts: google.maps.places.AutocompleteOptions = {
        types: this.types ?? ['(cities)'],
        fields: ['address_components', 'geometry', 'formatted_address'],
        componentRestrictions: this.country
          ? { country: this.country }
          : undefined,
      };
      this.autocomplete = new google.maps.places.Autocomplete(input, opts);
      this.listener = this.autocomplete.addListener('place_changed', () => {
        this.zone.run(() => {
          const place = this.autocomplete!.getPlace();
          const { city, formatted } = parseCity(place);
          const loc = place.geometry?.location ?? null;
          this.placeSelected.emit({
            city: city || formatted,
            lat: loc ? loc.lat() : null,
            lng: loc ? loc.lng() : null,
            formattedAddress: formatted,
          });
          // Keep visible value tidy
          if (city) input.value = city;
        });
      });
    };

    // If API already loaded:
    if (window.google?.maps?.places) {
      init();
      return;
    }

    // Otherwise wait for script (assumes you load JS API with &libraries=places)
    const check = setInterval(() => {
      if (window.google?.maps?.places) {
        clearInterval(check);
        init();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.listener?.remove();
  }
}

/** Extracts 'city' from address_components with fallbacks */
function parseCity(place: google.maps.places.PlaceResult): {
  city: string;
  formatted: string;
} {
  const formatted = place.formatted_address ?? '';
  const comps = place.address_components ?? [];
  const get = (type: string) =>
    comps.find((c) => c.types.includes(type))?.long_name || '';
  // common city fallbacks
  const locality = get('locality');
  const admin2 = get('administrative_area_level_2');
  const admin1 = get('administrative_area_level_1');
  const postal = get('postal_town');
  const city = locality || postal || admin2 || admin1 || '';
  return { city, formatted };
}
