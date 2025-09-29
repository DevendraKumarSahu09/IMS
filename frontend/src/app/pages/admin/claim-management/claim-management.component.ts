import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  decidedByAgentId?: string | {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface ClaimStatusUpdate {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
}

interface ClaimFilters {
  status: string;
  dateFrom: string;
  dateTo: string;
  amountMin: number | null;
  amountMax: number | null;
  search: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

@Component({
  selector: 'app-claim-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './claim-management.component.html',
  styleUrl: './claim-management.component.css'
})
export class ClaimManagementComponent implements OnInit, OnDestroy {
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
  statusUpdate: ClaimStatusUpdate = {
    status: 'PENDING',
    notes: ''
  };
  bulkAction = '';
  filterTimeout: any;

  // Make Math available in template
  Math = Math;

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
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
  }

  loadClaims(): void {
    this.loading = true;
    this.error = null;

    const params = new URLSearchParams();
    params.set('page', this.pagination.page.toString());
    params.set('limit', this.pagination.limit.toString());
    
    if (this.filters.status) params.set('status', this.filters.status);
    if (this.filters.dateFrom) params.set('dateFrom', this.filters.dateFrom);
    if (this.filters.dateTo) params.set('dateTo', this.filters.dateTo);
    if (this.filters.amountMin) params.set('amountMin', this.filters.amountMin.toString());
    if (this.filters.amountMax) params.set('amountMax', this.filters.amountMax.toString());
    if (this.filters.search) params.set('search', this.filters.search);

    this.httpService.get(`/claims?${params.toString()}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.claims = response.data || [];
          this.pagination = response.pagination || this.pagination;
        } else {
          this.claims = [];
        }
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
    this.pagination.page = 1;
    this.loadClaims();
  }

  onFilterChange(): void {
    // Auto-apply filters after a short delay to avoid too many API calls
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.applyFilters();
    }, 500);
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.filters.status) count++;
    if (this.filters.dateFrom) count++;
    if (this.filters.dateTo) count++;
    if (this.filters.amountMin !== null && this.filters.amountMin !== undefined) count++;
    if (this.filters.amountMax !== null && this.filters.amountMax !== undefined) count++;
    if (this.filters.search) count++;
    return count;
  }

  clearFilters(): void {
    this.filters = {
      status: '',
      dateFrom: '',
      dateTo: '',
      amountMin: null,
      amountMax: null,
      search: ''
    };
    this.pagination.page = 1;
    this.loadClaims();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination.pages) {
      this.pagination.page = page;
      this.loadClaims();
    }
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

  isClaimSelected(claimId: string): boolean {
    return this.selectedClaims.includes(claimId);
  }

  openStatusModal(claim: Claim): void {
    this.editingClaim = claim;
    this.statusUpdate = {
      status: claim.status,
      notes: claim.decisionNotes || ''
    };
    this.showStatusModal = true;
  }

  updateClaimStatus(): void {
    if (!this.editingClaim) return;

    this.httpService.put(`/claims/${this.editingClaim._id}/status`, this.statusUpdate).subscribe({
      next: (response: any) => {
        this.loadClaims();
        this.closeStatusModal();
        this.notificationService.success(
          'Status Updated',
          `Claim status updated to ${this.statusUpdate.status.toLowerCase()}`
        );
      },
      error: (error) => {
        console.error('Error updating claim status:', error);
        
        let errorMessage = 'Failed to update claim status';
        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        }
        
        this.notificationService.error(
          'Update Failed',
          errorMessage
        );
      }
    });
  }

  closeStatusModal(): void {
    this.editingClaim = null;
    this.showStatusModal = false;
    this.statusUpdate = {
      status: 'PENDING',
      notes: ''
    };
  }

  performBulkAction(): void {
    if (this.selectedClaims.length === 0) {
      this.notificationService.warning('No Selection', 'Please select claims to perform bulk action');
      return;
    }

    if (!this.bulkAction) {
      this.notificationService.warning('No Action', 'Please select a bulk action');
      return;
    }

    if (confirm(`Are you sure you want to ${this.bulkAction.toLowerCase()} ${this.selectedClaims.length} claim(s)?`)) {
      // For now, we'll update claims one by one
      // In a real app, you'd want a bulk update API
      let completed = 0;
      const total = this.selectedClaims.length;

      this.selectedClaims.forEach(claimId => {
        this.httpService.put(`/claims/${claimId}/status`, {
          status: this.bulkAction,
          notes: `Bulk ${this.bulkAction.toLowerCase()} by admin`
        }).subscribe({
          next: () => {
            completed++;
            if (completed === total) {
              this.loadClaims();
              this.selectedClaims = [];
              this.bulkAction = '';
              this.notificationService.success(
                'Bulk Action Complete',
                `${total} claims ${this.bulkAction.toLowerCase()}d successfully`
              );
            }
          },
          error: (error) => {
            console.error(`Error updating claim ${claimId}:`, error);
            completed++;
            if (completed === total) {
              this.loadClaims();
              this.selectedClaims = [];
              this.bulkAction = '';
              this.notificationService.warning(
                'Partial Success',
                'Some claims were updated successfully'
              );
            }
          }
        });
      });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return '✅';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      default: return '❓';
    }
  }

  getTotalPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const start = Math.max(1, this.pagination.page - Math.floor(maxVisible / 2));
    const end = Math.min(this.pagination.pages, start + maxVisible - 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getClaimSummary(): { total: number; pending: number; approved: number; rejected: number } {
    return {
      total: this.claims.length,
      pending: this.claims.filter(c => c.status === 'PENDING').length,
      approved: this.claims.filter(c => c.status === 'APPROVED').length,
      rejected: this.claims.filter(c => c.status === 'REJECTED').length
    };
  }

  getClaimUserName(claim: Claim): string {
    // Handle populated userId structure
    if (typeof claim.userId === 'object' && claim.userId?.name) {
      return claim.userId.name;
    }
    return 'Unknown';
  }

  getClaimUserEmail(claim: Claim): string {
    // Handle populated userId structure
    if (typeof claim.userId === 'object' && claim.userId?.email) {
      return claim.userId.email;
    }
    return 'No email';
  }

  getClaimPolicyTitle(claim: Claim): string {
    // Handle populated userPolicyId structure
    if (typeof claim.userPolicyId === 'object' && claim.userPolicyId?.policyProductId?.title) {
      return claim.userPolicyId.policyProductId.title;
    }
    return 'Unknown Policy';
  }

  getClaimPolicyCode(claim: Claim): string {
    // Handle populated userPolicyId structure
    if (typeof claim.userPolicyId === 'object' && claim.userPolicyId?.policyProductId?.code) {
      return claim.userPolicyId.policyProductId.code;
    }
    return 'No code';
  }
}
