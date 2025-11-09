import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

export interface CandidateNavItem {
  id: string;
}

@Injectable({ providedIn: 'root' })
export class CandidateNavService {
  private list$ = new BehaviorSubject<CandidateNavItem[]>([]);
  private currentId$ = new BehaviorSubject<string | null>(null);

  setList(items: CandidateNavItem[]) {
    const seen = new Set<string>();
    const cleaned = items.filter(
      (i) => i?.id && !seen.has(i.id) && seen.add(i.id)
    );
    this.list$.next(cleaned);
  }

  setCurrentId(id: string | null) {
    this.currentId$.next(id);
  }

  neighbors$(): Observable<{
    prevId: string | null;
    nextId: string | null;
    index: number;
    total: number;
  }> {
    return combineLatest([this.list$, this.currentId$]).pipe(
      map(([list, currentId]) => {
        const ids = list.map((i) => i.id);
        const total = ids.length;
        const index = currentId ? ids.indexOf(currentId) : -1;
        if (index < 0 || total === 0) {
          return { prevId: null, nextId: null, index: -1, total };
        }
        const prevId = index > 0 ? ids[index - 1] : null;
        const nextId = index < total - 1 ? ids[index + 1] : null;
        return { prevId, nextId, index, total };
      })
    );
  }
}
