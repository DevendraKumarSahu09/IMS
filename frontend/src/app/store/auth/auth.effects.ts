import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          map((response) => AuthActions.loginSuccess({ 
            user: response.user, 
            token: response.token 
          })),
          catchError((error) => of(AuthActions.loginFailure({ 
            error: error.message || 'Login failed' 
          })))
        )
      )
    )
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ name, email, password, role }) =>
        this.authService.register(name, email, password, role).pipe(
          map(() => ({ type: '[Auth] Register Complete' })), // Dummy action since service handles success
          catchError((error) => of(AuthActions.registerFailure({ 
            error: error.message || 'Registration failed' 
          })))
        )
      )
    )
  );

  getCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.getCurrentUser),
      switchMap(() =>
        this.authService.getCurrentUser().pipe(
          map((user) => AuthActions.getCurrentUserSuccess({ user })),
          catchError((error) => of(AuthActions.getCurrentUserFailure({ 
            error: error.message || 'Failed to get current user' 
          })))
        )
      )
    )
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(({ user, token }) => {
        if (token) {
          localStorage.setItem('token', token);
        }
        // Show success toast notification
        this.notificationService.success(
          'Welcome Back!', 
          `Hello ${user.name}, you have been logged in successfully.`
        );
        this.router.navigate(['/dashboard']);
      })
    ),
    { dispatch: false }
  );

  registerSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.registerSuccess),
      tap(({ user, token }) => {
        if (token) {
          localStorage.setItem('token', token);
        }
        // Update auth state - we need to access the private authStateSubject
        // For now, we'll let the service handle this in its own tap operator
        // Show success toast and redirect to login
        this.notificationService.success('Registration Successful', 'Please login with your credentials.');
        this.router.navigate(['/login']);
      })
    ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        localStorage.removeItem('token');
      })
    ),
    { dispatch: false }
  );
}
