import { Injectable } from '@angular/core';
import { Resolve, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AppState } from '../../store';
import { selectUserRole } from '../../store/auth/auth.selectors';

@Injectable({
  providedIn: 'root'
})
export class DashboardResolver implements Resolve<string> {
  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {}

  resolve(): Observable<string> {
    return this.store.select(selectUserRole).pipe(
      take(1),
      map(role => {
        switch (role) {
          case 'admin':
            return 'admin';
          case 'agent':
            return 'agent';
          case 'customer':
            return 'user';
          default:
            this.router.navigate(['/login']);
            return 'user';
        }
      })
    );
  }
}
