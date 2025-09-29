import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../store';
import { selectUser } from '../../../store/auth/auth.selectors';
import { HttpService } from '../../../services/http.service';
import { NotificationService } from '../../../shared/services/notification.service';

interface Claim {
  _id: string;
  userId: string | {
    name: string;
    email: string;
  };
  userPolicyId: string | {
    policyProductId: {
      title: string;
      code: string;
    };
  };
  incidentDate: string;
  description: string;
  amountClaimed: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionNotes?: string;
  decidedByAgentId?: string | any;
  createdAt: string;
  updatedAt?: string;
  user?: {
    name: string;
    email: string;
  };
  policy?: {
    policyProductId: {
      title: string;
      code: string;
    };
  };
}

interface ClaimFilters {
  status: string;
  dateFrom: string;
  dateTo: string;
  amountMin: number | null;
  amountMax: number | null;
  search: string;
}

interface ClaimStatusUpdate {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Agent Claim Management Component
 * 
 * According to completePro.txt specification and improved business logic:
 * - Agents can view only claims assigned to them (GET /api/v1/claims)
 * - Agents can update claim status (PUT /api/v1/claims/:id/status)
 * - Agents can add decision notes when updating status
 * - Role-based access control ensures only agents/admins can process claims
 * - Claims must be assigned by admin before agents can process them
 */
@Component({
  selector: 'app-agent-claim-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './claim-management.component.html',
  styleUrl: './claim-management.component.css'
})
export class AgentClaimManagementComponent implements OnInit, OnDestroy {
  user$: Observable<any>;
  claims: Claim[] = [];
  loading = true;
  error: string | null = null;
  pagination: PaginationInfo = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };
  filters: ClaimFilters = {
    status: '',
    dateFrom: '',
    dateTo: '',
    amountMin: null,
    amountMax: null,
    search: ''
  };
  selectedClaims: string[] = [];
  editingClaim: Claim | null = null;
  showStatusModal = false;
  showClaimDetailsModal = false;
  viewingClaim: Claim | null = null;
  statusUpdate: ClaimStatusUpdate = {
    status: 'PENDING',
    notes: ''
  };
  bulkAction = '';

  // Make Math available in template
  Math = Math;

  // Filter debounce timeout
  private filterTimeout: any;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private httpService: HttpService,
    private notificationService: NotificationService
  ) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    this.loadClaims();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
  }

  loadClaims(): void {
    this.loading = true;
    this.error = null;

    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit
    };

    // Only add status filter if it has a value
    if (this.filters.status) {
      params.status = this.filters.status;
    }

    // Build query string
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      const value = (params as any)[key];
      if (value !== '' && value !== null && value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/claims?${queryString}` : '/claims';
    
    console.log('Status filter being sent:', this.filters.status);
    console.log('API endpoint:', endpoint);
    
    this.httpService.get(endpoint).subscribe({
      next: (response: any) => {
        console.log('Claims response:', response);
        this.claims = response.success ? response.data || [] : response || [];
        this.pagination = response.pagination || this.pagination;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading claims:', error);
        this.error = 'Failed to load claims';
        this.loading = false;
        this.notificationService.error('Error', 'Failed to load claims');
      }
    });
  }

  applyFilters(): void {
    this.pagination.page = 1; // Reset to first page
    this.loadClaims();
  }

  onFilterChange(): void {
    // Debounce the filter application to avoid too many API calls
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  clearFilters(): void {
    this.filters.status = '';
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.pagination.page = page;
    this.loadClaims();
  }

  onLimitChange(limit: number): void {
    this.pagination.limit = limit;
    this.pagination.page = 1;
    this.loadClaims();
  }

  selectClaim(claimId: string): void {
    const index = this.selectedClaims.indexOf(claimId);
    if (index > -1) {
      this.selectedClaims.splice(index, 1);
    } else {
      this.selectedClaims.push(claimId);
    }
  }

  selectAllClaims(): void {
    if (this.selectedClaims.length === this.claims.length) {
      this.selectedClaims = [];
    } else {
      this.selectedClaims = this.claims.map(claim => claim._id);
    }
  }

  editClaim(claim: Claim): void {
    this.editingClaim = { ...claim };
    this.statusUpdate = {
      status: claim.status,
      notes: claim.decisionNotes || ''
    };
    this.showStatusModal = true;
  }

  viewClaimDetails(claim: Claim): void {
    this.viewingClaim = { ...claim };
    this.showClaimDetailsModal = true;
  }

  closeClaimDetailsModal(): void {
    this.showClaimDetailsModal = false;
    this.viewingClaim = null;
  }




  updateClaimStatus(claimId?: string, status?: string, notes?: string): void {
    const targetClaimId = claimId || this.editingClaim?._id;
    const targetStatus = status || this.statusUpdate.status;
    const targetNotes = notes || this.statusUpdate.notes;

    if (!targetClaimId) return;

    this.httpService.put(`/claims/${targetClaimId}/status`, { status: targetStatus, notes: targetNotes })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.showStatusModal = false)
      )
      .subscribe({
        next: (response: any) => {
          this.notificationService.success('Success', `Claim ${targetStatus.toLowerCase()} successfully`);
          this.loadClaims(); // Refresh the list
        },
        error: (error) => {
          console.error('Error updating claim status:', error);
          this.notificationService.error('Error', 'Failed to update claim status');
        }
      });
  }

  bulkUpdateStatus(status: string): void {
    if (this.selectedClaims.length === 0) {
      this.notificationService.warning('Warning', 'Please select claims to update');
      return;
    }

    const updatePromises = this.selectedClaims.map(claimId => 
      this.httpService.put(`/claims/${claimId}/status`, { 
        status, 
        notes: `Bulk ${status.toLowerCase()} by agent` 
      }).toPromise()
    );

    Promise.all(updatePromises)
      .then(() => {
        this.notificationService.success('Success', `${this.selectedClaims.length} claims ${status.toLowerCase()} successfully`);
        this.selectedClaims = [];
        this.loadClaims();
      })
      .catch(error => {
        console.error('Error bulk updating claims:', error);
        this.notificationService.error('Error', 'Failed to update some claims');
      });
  }

  getClaimUserName(claim: Claim): string {
    // Handle populated userId structure
    if (typeof claim.userId === 'object' && claim.userId?.name) {
      return claim.userId.name;
    }
    // Handle user object structure
    else if (claim.user?.name) {
      return claim.user.name;
    }
    return 'Unknown';
  }

  getClaimUserEmail(claim: Claim): string {
    // Handle populated userId structure
    if (typeof claim.userId === 'object' && claim.userId?.email) {
      return claim.userId.email;
    }
    // Handle user object structure
    else if (claim.user?.email) {
      return claim.user.email;
    }
    return '';
  }

  getClaimPolicyTitle(claim: Claim): string {
    // Handle populated userPolicyId structure
    if (typeof claim.userPolicyId === 'object' && claim.userPolicyId?.policyProductId?.title) {
      return claim.userPolicyId.policyProductId.title;
    }
    // Handle policy object structure
    else if (claim.policy?.policyProductId?.title) {
      return claim.policy.policyProductId.title;
    }
    return 'Unknown Policy';
  }

  getClaimPolicyCode(claim: Claim): string {
    // Handle populated userPolicyId structure
    if (typeof claim.userPolicyId === 'object' && claim.userPolicyId?.policyProductId?.code) {
      return claim.userPolicyId.policyProductId.code;
    }
    // Handle policy object structure
    else if (claim.policy?.policyProductId?.code) {
      return claim.policy.policyProductId.code;
    }
    return '';
  }

  formatCurrency(amount: number): string {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'rejected': return 'badge-error';
      default: return 'badge-neutral';
    }
  }


  quickApproveClaim(claimId: string): void {
    this.updateClaimStatus(claimId, 'APPROVED', 'Approved by agent');
  }

  quickRejectClaim(claimId: string): void {
    this.updateClaimStatus(claimId, 'REJECTED', 'Rejected by agent');
  }

  getClaimTimeline(claim: Claim): any[] {
    const timeline = [];
    
    // Claim submission
    timeline.push({
      action: 'Claim Submitted',
      description: 'Customer submitted the claim',
      timestamp: claim.createdAt,
      icon: '📝',
      color: 'text-blue-600'
    });

    // Status updates
    if (claim.status === 'APPROVED') {
      timeline.push({
        action: 'Claim Approved',
        description: claim.decisionNotes || 'Claim has been approved',
        timestamp: claim.updatedAt || claim.createdAt,
        icon: '✅',
        color: 'text-green-600'
      });
    } else if (claim.status === 'REJECTED') {
      timeline.push({
        action: 'Claim Rejected',
        description: claim.decisionNotes || 'Claim has been rejected',
        timestamp: claim.updatedAt || claim.createdAt,
        icon: '❌',
        color: 'text-red-600'
      });
    } else {
      timeline.push({
        action: 'Under Review',
        description: 'Claim is currently being reviewed',
        timestamp: claim.createdAt,
        icon: '⏳',
        color: 'text-yellow-600'
      });
    }

    return timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getDaysSinceIncident(claim: Claim): number {
    const incidentDate = new Date(claim.incidentDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - incidentDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysSinceSubmission(claim: Claim): number {
    const submissionDate = new Date(claim.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submissionDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Helper methods for template type checking
  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null;
  }

  getUserId(claim: Claim): string {
    return this.isObject(claim.userId) ? (claim.userId as any)._id : (claim.userId as string);
  }

  getUserPolicyId(claim: Claim): string {
    return this.isObject(claim.userPolicyId) ? (claim.userPolicyId as any)._id : (claim.userPolicyId as string);
  }

  // Fix file upload method
}
