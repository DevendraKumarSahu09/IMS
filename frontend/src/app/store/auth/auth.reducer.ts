import { createReducer, on } from '@ngrx/store';
import { AuthState, initialAuthState } from './auth.state';
import * as AuthActions from './auth.actions';

export { AuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,
  
  // Login
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    isAuthenticated: true,
    loading: false,
    error: null
  })),
  
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false,
    user: null,
    token: null
  })),
  
  // Register
  on(AuthActions.register, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.registerSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    isAuthenticated: true,
    loading: false,
    error: null
  })),
  
  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false,
    user: null,
    token: null
  })),
  
  // Logout
  on(AuthActions.logout, (state) => ({
    ...state,
    user: null,
    token: null,
    isAuthenticated: false,
    error: null
  })),
  
  // Get Current User
  on(AuthActions.getCurrentUser, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.getCurrentUserSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    loading: false,
    error: null,
    token: state.token || localStorage.getItem('token') // Ensure token is preserved
  })),
  
  on(AuthActions.getCurrentUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false,
    user: null,
    token: null
  })),
  
  // Clear Error
  on(AuthActions.clearError, (state) => ({
    ...state,
    error: null
  })),

  // Initialize Auth
  on(AuthActions.initializeAuth, (state) => {
    const token = localStorage.getItem('token');
    return {
      ...state,
      token,
      isAuthenticated: !!token,
      loading: false
    };
  })
);
