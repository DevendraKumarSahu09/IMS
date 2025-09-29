import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';

export interface Policy {
  _id: string;
  code: string;
  title: string;
  description: string;
  premium: number;
  termMonths: number;
  minSumInsured: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserPolicy {
  _id: string;
  userId: string | any;
  policyProductId: string | any; // Can be populated as Policy object
  policyProduct?: Policy;
  startDate: Date | string;
  endDate: Date | string;
  premiumPaid: number;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  assignedAgentId?: string | any;
  assignedAgent?: any;
  nominee: {
    name: string;
    relation: string;
  };
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface PolicyPurchaseRequest {
  startDate: string;
  termMonths: number;
  nominee: {
    name: string;
    relation: string;
  };
}

export interface Payment {
  _id: string;
  userId: string | any;
  userPolicyId: string | any;
  amount: number;
  method: 'CARD' | 'NETBANKING' | 'OFFLINE' | 'SIMULATED';
  reference: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'agent' | 'admin';
  createdAt: Date | string;
  updatedAt?: Date | string;
}

@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  private policiesSubject = new BehaviorSubject<Policy[]>([]);
  private userPoliciesSubject = new BehaviorSubject<UserPolicy[]>([]);
  
  public policies$ = this.policiesSubject.asObservable();
  public userPolicies$ = this.userPoliciesSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // Get all available policies
  getPolicies(params?: any): Observable<Policy[]> {
    return this.apiService.get<Policy[]>('/policies', params).pipe(
      map(response => response.data || []),
      tap(policies => this.policiesSubject.next(policies))
    );
  }

  // Get policy by ID
  getPolicy(id: string): Observable<Policy> {
    return this.apiService.get<Policy>(`/policies/${id}`).pipe(
      map(response => response.data!)
    );
  }

  // Purchase a policy
  purchasePolicy(policyId: string, purchaseData: PolicyPurchaseRequest): Observable<UserPolicy> {
    console.log('PolicyService: Purchasing policy with ID:', policyId);
    console.log('PolicyService: Purchase data:', purchaseData);
    console.log('PolicyService: API endpoint:', `/policies/${policyId}/purchase`);
    
    return this.apiService.post<UserPolicy>(`/policies/${policyId}/purchase`, purchaseData).pipe(
      map(response => {
        console.log('PolicyService: API response received:', response);
        return response.data!
      })
    );
  }

  // Get user's policies
  getUserPolicies(params?: any): Observable<UserPolicy[]> {
    return this.apiService.get<UserPolicy[]>('/user-policies', params).pipe(
      map(response => response.data || []),
      tap(policies => this.userPoliciesSubject.next(policies))
    );
  }

  // Get user policy by ID
  getUserPolicy(id: string): Observable<UserPolicy> {
    return this.apiService.get<UserPolicy>(`/user-policies/${id}`).pipe(
      map(response => response.data!)
    );
  }

  // Cancel a policy
  cancelPolicy(policyId: string): Observable<any> {
    return this.apiService.put(`/user/policies/${policyId}/cancel`, {}).pipe(
      map(response => response.data)
    );
  }

  // Search policies
  searchPolicies(query: string, filters?: any): Observable<Policy[]> {
    const params = {
      search: query,
      ...filters
    };
    return this.getPolicies(params);
  }



  // Format currency
  formatCurrency(amount: number): string {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  }


  // Get status color
  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  // Calculate policy end date
  calculateEndDate(startDate: Date, termMonths: number): Date {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + termMonths);
    return endDate;
  }

  // Check if policy is active
  isPolicyActive(userPolicy: UserPolicy): boolean {
    const now = new Date();
    return userPolicy.status === 'ACTIVE' && 
           new Date(userPolicy.startDate) <= now && 
           new Date(userPolicy.endDate) >= now;
  }

  // Get days until expiry
  getDaysUntilExpiry(userPolicy: UserPolicy): number {
    const now = new Date();
    const endDate = new Date(userPolicy.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get user's claims
  getClaims(): Observable<any[]> {
    return this.apiService.get<any[]>('/claims').pipe(
      map(response => response.data || [])
    );
  }
}
