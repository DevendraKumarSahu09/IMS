import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.notificationService.error('API Error', errorMessage);
    return throwError(() => error);
  }

  // Generic HTTP methods
  get<T>(endpoint: string, params?: any): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    console.log('ApiService: Making POST request to:', url);
    console.log('ApiService: Request data:', data);
    console.log('ApiService: Request headers:', headers);
    
    return this.http.post<ApiResponse<T>>(url, data, {
      headers: headers
    }).pipe(
      catchError((error) => {
        console.error('ApiService: HTTP error:', error);
        return this.handleError(error);
      })
    );
  }

  put<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // File upload
  uploadFile<T>(endpoint: string, file: File, additionalData?: any): Observable<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const headers = new HttpHeaders();
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, formData, {
      headers
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Authentication methods
  login(email: string, password: string): Observable<ApiResponse<{ token: string; user: any }>> {
    return this.post<{ token: string; user: any }>('/auth/login', { email, password });
  }

  register(userData: any): Observable<ApiResponse<{ token: string; user: any }>> {
    return this.post<{ token: string; user: any }>('/auth/register', userData);
  }

  // Policy methods
  getPolicies(params?: any): Observable<ApiResponse<any>> {
    return this.get<any>('/policies', params);
  }

  getPolicy(id: string): Observable<ApiResponse<any>> {
    return this.get<any>(`/policies/${id}`);
  }

  createPolicy(policyData: any): Observable<ApiResponse<any>> {
    return this.post<any>('/policies', policyData);
  }

  updatePolicy(id: string, policyData: any): Observable<ApiResponse<any>> {
    return this.put<any>(`/policies/${id}`, policyData);
  }

  deletePolicy(id: string): Observable<ApiResponse<any>> {
    return this.delete<any>(`/policies/${id}`);
  }

  // Claim methods
  getClaims(params?: any): Observable<ApiResponse<any>> {
    return this.get<any>('/claims', params);
  }

  getClaim(id: string): Observable<ApiResponse<any>> {
    return this.get<any>(`/claims/${id}`);
  }

  createClaim(claimData: any): Observable<ApiResponse<any>> {
    return this.post<any>('/claims', claimData);
  }

  updateClaim(id: string, claimData: any): Observable<ApiResponse<any>> {
    return this.put<any>(`/claims/${id}`, claimData);
  }

  // Payment methods
  getPayments(params?: any): Observable<ApiResponse<any>> {
    return this.get<any>('/payments', params);
  }

  createPayment(paymentData: any): Observable<ApiResponse<any>> {
    return this.post<any>('/payments', paymentData);
  }

  // User methods
  getUsers(params?: any): Observable<ApiResponse<any>> {
    return this.get<any>('/users', params);
  }

  getUser(id: string): Observable<ApiResponse<any>> {
    return this.get<any>(`/users/${id}`);
  }

  updateUser(id: string, userData: any): Observable<ApiResponse<any>> {
    return this.put<any>(`/users/${id}`, userData);
  }

  // Dashboard methods
  getDashboardStats(): Observable<ApiResponse<any>> {
    return this.get<any>('/dashboard/stats');
  }

  getAgentDashboard(): Observable<ApiResponse<any>> {
    return this.get<any>('/dashboard/agent');
  }

  getAdminDashboard(): Observable<ApiResponse<any>> {
    return this.get<any>('/dashboard/admin');
  }

  // User Policy methods
  getUserPolicies(params?: any): Observable<ApiResponse<any>> {
    return this.get<any>('/user-policies', params);
  }

  getUserPolicy(id: string): Observable<ApiResponse<any>> {
    return this.get<any>(`/user-policies/${id}`);
  }
}
