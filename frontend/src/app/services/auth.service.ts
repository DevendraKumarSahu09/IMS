import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { gql } from 'apollo-angular';
import { Observable, BehaviorSubject, timer } from 'rxjs';
import { map, tap, retry, retryWhen, delay, take } from 'rxjs/operators';
import { User } from '../store/auth/auth.state';
import { Store } from '@ngrx/store';
import { AppState } from '../store';
import * as AuthActions from '../store/auth/auth.actions';
import { Router } from '@angular/router';
import { NotificationService } from '../shared/services/notification.service';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($name: String!, $email: String!, $password: String!, $role: String!) {
    register(name: $name, email: $email, password: $password, role: $role) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

const GET_CURRENT_USER_QUERY = gql`
  query GetCurrentUser {
    me {
      id
      name
      email
      role
    }
  }
`;

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<{ isAuthenticated: boolean; user: User | null }>({
    isAuthenticated: false,
    user: null
  });
  
  public authState$ = this.authStateSubject.asObservable();
  private isInitializing = false;

  constructor(
    private apollo: Apollo,
    private store: Store<AppState>,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    // Prevent multiple simultaneous initialization attempts
    if (this.isInitializing) {
      console.log('Auth initialization already in progress, skipping...');
      return;
    }

    const token = localStorage.getItem('token');
    console.log('Initializing auth with token:', token ? 'present' : 'missing');
    
    if (token) {
      this.isInitializing = true;
      
      // First update both auth state subject and store to show user as authenticated
      this.authStateSubject.next({ isAuthenticated: true, user: null });
      this.store.dispatch(AuthActions.initializeAuth());
      
      console.log('Auth initialization: Set user as authenticated with token');
      
      // Then try to get the current user and update both subject and store
      this.getCurrentUser().pipe(
        retryWhen(errors => 
          errors.pipe(
            delay(1000), // Wait 1 second before retry
            take(2) // Only retry twice
          )
        )
      ).subscribe({
        next: (user) => {
          console.log('Successfully restored user session:', user);
          this.authStateSubject.next({ isAuthenticated: true, user });
          this.store.dispatch(AuthActions.getCurrentUserSuccess({ user }));
          this.isInitializing = false;
        },
        error: (error) => {
          console.error('Failed to get current user on initialization after retries:', error);
          this.isInitializing = false;
          
          // Only logout if it's a 401 (unauthorized) error, not network errors
          if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            console.log('Token is invalid, logging out');
            this.logout();
          } else {
            console.log('Network error during auth initialization, keeping user logged in with token');
            // Keep user logged in but without user data
            this.authStateSubject.next({ isAuthenticated: true, user: null });
            // Also update the store to keep it in sync
            // We'll create a minimal user object for the store
            const minimalUser = { id: '', name: 'User', email: '', role: 'customer' as const };
            this.store.dispatch(AuthActions.getCurrentUserSuccess({ user: minimalUser }));
          }
        }
      });
    } else {
      // No token, ensure clean state
      this.authStateSubject.next({ isAuthenticated: false, user: null });
      this.store.dispatch(AuthActions.initializeAuth());
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.apollo.mutate<{ login: LoginResponse }>({
      mutation: LOGIN_MUTATION,
      variables: { email, password },
      errorPolicy: 'all'
    }).pipe(
      map(result => {
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message);
        }
        if (!result.data || !result.data.login) {
          throw new Error('Login failed - no data returned');
        }
        return result.data.login;
      }),
      tap(response => {
        localStorage.setItem('token', response.token);
        this.authStateSubject.next({ isAuthenticated: true, user: response.user });
        // Note: loginSuccess action is dispatched by the login$ effect, not here
      })
    );
  }

  register(name: string, email: string, password: string, role: string): Observable<RegisterResponse> {
    return this.apollo.mutate<{ register: RegisterResponse }>({
      mutation: REGISTER_MUTATION,
      variables: { name, email, password, role },
      errorPolicy: 'all'
    }).pipe(
      map(result => {
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message);
        }
        if (!result.data || !result.data.register) {
          throw new Error('Registration failed - no data returned');
        }
        return result.data.register;
      }),
      tap(response => {
        localStorage.setItem('token', response.token);
        this.authStateSubject.next({ isAuthenticated: true, user: response.user });
        this.store.dispatch(AuthActions.registerSuccess({ user: response.user, token: response.token }));
      })
    );
  }

  getCurrentUser(): Observable<User> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token available');
    }

    return this.apollo.query<{ me: User }>({
      query: GET_CURRENT_USER_QUERY,
      errorPolicy: 'all',
      context: {
        headers: {
          authorization: `Bearer ${token}`
        }
      }
    }).pipe(
      map(result => {
        if (result.errors && result.errors.length > 0) {
          const errorMessage = result.errors[0].message;
          console.error('GraphQL error:', errorMessage);
          throw new Error(errorMessage);
        }
        if (!result.data || !result.data.me) {
          throw new Error('Failed to get current user - no data returned');
        }
        return result.data.me;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.apollo.client.clearStore();
    this.authStateSubject.next({ isAuthenticated: false, user: null });
    this.store.dispatch(AuthActions.logout());
    this.notificationService.info('Logged Out', 'You have been logged out successfully');
    
    // Use setTimeout to ensure the auth state is updated before navigation
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 100);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const hasToken = !!token;
    const currentState = this.authStateSubject.value;
    
    console.log('isAuthenticated check:', { 
      hasToken, 
      isAuthenticated: currentState.isAuthenticated, 
      hasUser: !!currentState.user,
      isInitializing: this.isInitializing
    });
    
    // If we have a token, consider the user authenticated
    // This is the most reliable check to prevent unnecessary redirects
    if (hasToken) {
      console.log('Token exists, considering user authenticated');
      return true;
    }
    
    return false;
  }

  hasValidToken(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  isReady(): boolean {
    return !this.isInitializing;
  }
}
