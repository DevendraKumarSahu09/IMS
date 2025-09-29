import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, catchError, of, timer } from 'rxjs';
import { AuthService } from '../../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const token = localStorage.getItem('token');
  console.log('Auth guard: Checking authentication for route:', state.url, 'Token present:', !!token);

  if (!token) {
    console.log('Auth guard: No token found, redirecting to login');
    router.navigate(['/login']);
    return false;
  }

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    console.log('Auth guard: User already authenticated, allowing access');
    return true;
  }

  // If we have a token but user is not authenticated, allow access
  // The component will handle the authentication check
  console.log('Auth guard: Token exists, allowing access');
  return true;
};
