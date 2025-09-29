import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  // Add authentication token to requests
  const token = localStorage.getItem('token');
  let authRequest = req;

  if (token) {
    authRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/login']);
        notificationService.error('Session Expired', 'Please login again');
      } else if (error.status === 403) {
        // Forbidden
        notificationService.error('Access Denied', 'You do not have permission to access this resource');
      } else if (error.status >= 500) {
        // Server error
        notificationService.error('Server Error', 'Something went wrong. Please try again later.');
      } else if (error.status === 0) {
        // Network error
        notificationService.error('Network Error', 'Please check your internet connection');
      }

      return throwError(() => error);
    })
  );
};
