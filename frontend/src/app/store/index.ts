import { ActionReducerMap } from '@ngrx/store';
import { AuthState, authReducer } from './auth/auth.reducer';

export interface AppState {
  auth: AuthState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer
};

export * from './auth/auth.actions';
export * from './auth/auth.state';
export * from './auth/auth.effects';
