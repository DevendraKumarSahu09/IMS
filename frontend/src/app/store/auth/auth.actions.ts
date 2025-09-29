import { createAction, props } from '@ngrx/store';
import { User } from './auth.state';

// Login Actions
export const login = createAction(
  '[Auth] Login',
  props<{ email: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User; token: string }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// Register Actions
export const register = createAction(
  '[Auth] Register',
  props<{ name: string; email: string; password: string; role: string }>()
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ user: User; token: string }>()
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>()
);

// Logout Actions
export const logout = createAction('[Auth] Logout');

// Get Current User Actions
export const getCurrentUser = createAction('[Auth] Get Current User');

export const getCurrentUserSuccess = createAction(
  '[Auth] Get Current User Success',
  props<{ user: User }>()
);

export const getCurrentUserFailure = createAction(
  '[Auth] Get Current User Failure',
  props<{ error: string }>()
);

// Clear Error
export const clearError = createAction('[Auth] Clear Error');

// Initialize Auth State
export const initializeAuth = createAction('[Auth] Initialize Auth');