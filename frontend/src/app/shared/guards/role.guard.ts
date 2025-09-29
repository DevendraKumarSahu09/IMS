import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { AppState } from '../../store';
import { selectUserRole } from '../../store/auth/auth.selectors';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const router = inject(Router);
    const store = inject(Store<AppState>);
    
    return store.select(selectUserRole).pipe(
      take(1),
      map(userRole => {
        if (!userRole) {
          router.navigate(['/login']);
          return false;
        }

        if (allowedRoles.includes(userRole)) {
          return true;
        } else {
          router.navigate(['/dashboard']);
          return false;
        }
      })
    );
  };
};
