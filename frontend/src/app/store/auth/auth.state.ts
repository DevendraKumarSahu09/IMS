export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'agent' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};
