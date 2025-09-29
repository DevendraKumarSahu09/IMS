import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { map, catchError, switchMap, retry, retryWhen, delay, take } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  // Dashboard data subjects
  private dashboardStatsSubject = new BehaviorSubject<any>(null);
  public dashboardStats$ = this.dashboardStatsSubject.asObservable();

  private policiesSubject = new BehaviorSubject<any[]>([]);
  public policies$ = this.policiesSubject.asObservable();

  private claimsSubject = new BehaviorSubject<any[]>([]);
  public claims$ = this.claimsSubject.asObservable();

  private paymentsSubject = new BehaviorSubject<any[]>([]);
  public payments$ = this.paymentsSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // Generic cache methods
  private getFromCache<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < item.ttl) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private clearCache(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  // Dashboard data methods
  getDashboardStats(forceRefresh: boolean = false): Observable<any> {
    const cacheKey = 'dashboard-stats';
    
    if (!forceRefresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.dashboardStatsSubject.next(cached);
        return of(cached);
      }
    }

    return this.apiService.getDashboardStats().pipe(
      map(response => {
        if (response.success && response.data) {
          this.setCache(cacheKey, response.data);
          this.dashboardStatsSubject.next(response.data);
          return response.data;
        }
        throw new Error('Failed to load dashboard stats');
      }),
      retry(2),
      catchError(error => {
        console.error('Error loading dashboard stats:', error);
        return throwError(() => error);
      })
    );
  }

  // Policies data methods
  getPolicies(params?: any, forceRefresh: boolean = false): Observable<any[]> {
    const cacheKey = `policies-${JSON.stringify(params || {})}`;
    
    if (!forceRefresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.policiesSubject.next(cached);
        return of(cached);
      }
    }

    return this.apiService.getPolicies(params).pipe(
      map(response => {
        if (response.success && response.data) {
          this.setCache(cacheKey, response.data);
          this.policiesSubject.next(response.data);
          return response.data;
        }
        throw new Error('Failed to load policies');
      }),
      retry(2),
      catchError(error => {
        console.error('Error loading policies:', error);
        return throwError(() => error);
      })
    );
  }

  // Claims data methods
  getClaims(params?: any, forceRefresh: boolean = false): Observable<any[]> {
    const cacheKey = `claims-${JSON.stringify(params || {})}`;
    
    if (!forceRefresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.claimsSubject.next(cached);
        return of(cached);
      }
    }

    return this.apiService.getClaims(params).pipe(
      map(response => {
        if (response.success && response.data) {
          this.setCache(cacheKey, response.data);
          this.claimsSubject.next(response.data);
          return response.data;
        }
        throw new Error('Failed to load claims');
      }),
      retry(2),
      catchError(error => {
        console.error('Error loading claims:', error);
        return throwError(() => error);
      })
    );
  }

  // Payments data methods
  getPayments(params?: any, forceRefresh: boolean = false): Observable<any[]> {
    const cacheKey = `payments-${JSON.stringify(params || {})}`;
    
    if (!forceRefresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.paymentsSubject.next(cached);
        return of(cached);
      }
    }

    return this.apiService.getPayments(params).pipe(
      map(response => {
        if (response.success && response.data) {
          this.setCache(cacheKey, response.data);
          this.paymentsSubject.next(response.data);
          return response.data;
        }
        throw new Error('Failed to load payments');
      }),
      retry(2),
      catchError(error => {
        console.error('Error loading payments:', error);
        return throwError(() => error);
      })
    );
  }

  // Create methods with optimistic updates
  createClaim(claimData: any): Observable<any> {
    return this.apiService.createClaim(claimData).pipe(
      map(response => {
        if (response.success && response.data) {
          // Optimistic update - add to local cache
          const currentClaims = this.claimsSubject.value;
          this.claimsSubject.next([response.data, ...currentClaims]);
          this.clearCache('claims-');
          return response.data;
        }
        throw new Error('Failed to create claim');
      }),
      catchError(error => {
        console.error('Error creating claim:', error);
        return throwError(() => error);
      })
    );
  }

  createPayment(paymentData: any): Observable<any> {
    return this.apiService.createPayment(paymentData).pipe(
      map(response => {
        if (response.success && response.data) {
          // Optimistic update - add to local cache
          const currentPayments = this.paymentsSubject.value;
          this.paymentsSubject.next([response.data, ...currentPayments]);
          this.clearCache('payments-');
          return response.data;
        }
        throw new Error('Failed to create payment');
      }),
      catchError(error => {
        console.error('Error creating payment:', error);
        return throwError(() => error);
      })
    );
  }

  // Auto-refresh methods
  startAutoRefresh(intervalMs: number = 30000): void {
    timer(0, intervalMs).pipe(
      switchMap(() => this.getDashboardStats(true)),
      catchError(error => {
        console.error('Auto-refresh error:', error);
        return of(null);
      })
    ).subscribe();
  }

  // Clear all cached data
  clearAllCache(): void {
    this.clearCache();
    this.dashboardStatsSubject.next(null);
    this.policiesSubject.next([]);
    this.claimsSubject.next([]);
    this.paymentsSubject.next([]);
  }

  // Get current cached data
  getCurrentPolicies(): any[] {
    return this.policiesSubject.value;
  }

  getCurrentClaims(): any[] {
    return this.claimsSubject.value;
  }

  getCurrentPayments(): any[] {
    return this.paymentsSubject.value;
  }

  getCurrentDashboardStats(): any {
    return this.dashboardStatsSubject.value;
  }
}
