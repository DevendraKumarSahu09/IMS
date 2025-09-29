import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';

export interface Claim {
  _id: string;
  userId: string | any;
  userPolicyId: string | any | {
    _id: string;
    policyProductId: {
      _id: string;
      title: string;
      code: string;
    };
  };
  incidentDate: Date | string;
  description: string;
  amountClaimed: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionNotes?: string;
  decidedByAgentId?: string | any;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface ClaimSubmissionRequest {
  userPolicyId: string; // Direct mapping to backend
  incidentDate: string;
  amountClaimed: number; // Direct mapping to backend
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClaimService {
  private claimsSubject = new BehaviorSubject<Claim[]>([]);
  public claims$ = this.claimsSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // Get all claims for the current user
  getClaims(params?: any): Observable<Claim[]> {
    return this.apiService.get<Claim[]>('/claims', params).pipe(
      map(response => response.data || []),
      tap(claims => this.claimsSubject.next(claims))
    );
  }

  // Get claim by ID
  getClaim(id: string): Observable<Claim> {
    return this.apiService.get<Claim>(`/claims/${id}`).pipe(
      map(response => response.data!)
    );
  }

  // Submit a new claim
  submitClaim(claimData: ClaimSubmissionRequest): Observable<Claim> {
    return this.apiService.post<Claim>('/claims', claimData).pipe(
      map(response => response.data!)
    );
  }

  // Update claim status (for agents/admins)
  updateClaimStatus(claimId: string, status: string, notes?: string): Observable<Claim> {
    return this.apiService.put<Claim>(`/claims/${claimId}`, {
      status,
      notes
    }).pipe(
      map(response => response.data!)
    );
  }

  // Get claims by status
  getClaimsByStatus(status: string): Observable<Claim[]> {
    return this.getClaims({ status });
  }

  // Get pending claims
  getPendingClaims(): Observable<Claim[]> {
    return this.getClaimsByStatus('PENDING');
  }

  // Get approved claims
  getApprovedClaims(): Observable<Claim[]> {
    return this.getClaimsByStatus('APPROVED');
  }

  // Get rejected claims
  getRejectedClaims(): Observable<Claim[]> {
    return this.getClaimsByStatus('REJECTED');
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
      case 'approved': return 'bg-emerald-100 text-emerald-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  // Get status icon
  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'M5 13l4 4L19 7';
      case 'pending': return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'rejected': return 'M6 18L18 6M6 6l12 12';
      case 'processing': return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15';
      default: return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    }
  }

  // Calculate claim statistics
  calculateClaimStats(claims: Claim[]): {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    processing: number;
    totalAmount: number;
    approvedAmount: number;
  } {
    const stats = {
      total: claims.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      processing: 0,
      totalAmount: 0,
      approvedAmount: 0
    };

    claims.forEach(claim => {
      stats.totalAmount += claim.amountClaimed;
      
      switch (claim.status?.toLowerCase()) {
        case 'pending':
          stats.pending++;
          break;
        case 'approved':
          stats.approved++;
          stats.approvedAmount += claim.amountClaimed;
          break;
        case 'rejected':
          stats.rejected++;
          break;
        case 'processing':
          stats.processing++;
          break;
      }
    });

    return stats;
  }

  // Check if claim can be submitted for a policy
  canSubmitClaim(userPolicy: any): boolean {
    if (!userPolicy) {
      console.log('canSubmitClaim: No userPolicy provided');
      return false;
    }
    
    const now = new Date();
    const startDate = new Date(userPolicy.startDate);
    const endDate = new Date(userPolicy.endDate);
    
    // Handle timezone issues by setting time to start/end of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    now.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    
    console.log('canSubmitClaim check:', {
      policyId: userPolicy._id,
      status: userPolicy.status,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      now: now.toISOString(),
      isActive: userPolicy.status === 'ACTIVE',
      isStarted: startDate <= now,
      isNotExpired: endDate >= now
    });
    
    // Policy must be active and within coverage period
    const canSubmit = userPolicy.status === 'ACTIVE' && 
                     startDate <= now && 
                     endDate >= now;
    
    console.log('canSubmitClaim result:', canSubmit);
    return canSubmit;
  }

  // Get claim history for a specific policy
  getClaimsForPolicy(userPolicyId: string): Observable<Claim[]> {
    return this.getClaims({ userPolicyId });
  }
}

