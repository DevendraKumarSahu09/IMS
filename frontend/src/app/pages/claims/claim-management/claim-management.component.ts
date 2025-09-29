import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ClaimService, Claim } from '../../../shared/services/claim.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { HttpService } from '../../../services/http.service';

interface ClaimWithDetails extends Claim {
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
  decisionNotes?: string;
}

interface ClaimStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  processing: number;
  totalAmount: number;
  approvedAmount: number;
}

interface ClaimStatusUpdate {
  status: string;
  notes?: string;
}

@Component({
  selector: 'app-claim-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './claim-management.component.html',
  styleUrl: './claim-management.component.css'
})
export class ClaimManagementComponent implements OnInit, OnDestroy {
  claims: ClaimWithDetails[] = [];
  filteredClaims: ClaimWithDetails[] = [];
  loading = true;
  error: string | null = null;
  
  // Filter and search properties
  searchQuery = '';
  selectedStatus = '';
  selectedType = '';
  selectedTimeframe = '';
  sortBy = 'newest';
  
  // Statistics
  stats: ClaimStats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    processing: 0,
    totalAmount: 0,
    approvedAmount: 0
  };

  // Selected claims for bulk actions
  selectedClaims: Set<string> = new Set();
  selectAll = false;

  // Status update modal
  showStatusModal = false;
  selectedClaim: ClaimWithDetails | null = null;
  statusUpdate: ClaimStatusUpdate = {
    status: '',
    notes: ''
  };
  updatingStatus = false;

  private destroy$ = new Subject<void>();

  constructor(
    private claimService: ClaimService,
    private notificationService: NotificationService,
    private httpService: HttpService
  ) {}

  ngOnInit(): void {
    this.loadClaims();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClaims(): void {
    this.loading = true;
    this.error = null;
    
    this.claimService.getClaims()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (claims) => {
          this.claims = claims;
          this.filteredClaims = [...claims];
          this.calculateStats();
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error loading claims:', error);
          this.error = 'Failed to load claims';
          this.notificationService.error('Error', 'Failed to load claims');
        }
      });
  }

  calculateStats(): void {
    this.stats = this.claimService.calculateClaimStats(this.claims);
  }

  applyFilters(): void {
    let filtered = [...this.claims];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(claim => 
        claim._id.toLowerCase().includes(query) ||
        claim.user?.name?.toLowerCase().includes(query) ||
        claim.policy?.policyProductId?.title?.toLowerCase().includes(query) ||
        claim.description.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(claim => 
        claim.status.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }

    // Type filter (based on policy type)
    if (this.selectedType) {
      filtered = filtered.filter(claim => 
        claim.policy?.policyProductId?.title?.toLowerCase().includes(this.selectedType.toLowerCase())
      );
    }

    // Timeframe filter
    if (this.selectedTimeframe) {
      const days = parseInt(this.selectedTimeframe);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filtered = filtered.filter(claim => 
        new Date(claim.createdAt) >= cutoffDate
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount_desc':
          return b.amountClaimed - a.amountClaimed;
        case 'amount_asc':
          return a.amountClaimed - b.amountClaimed;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    this.filteredClaims = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedType = '';
    this.selectedTimeframe = '';
    this.sortBy = 'newest';
    this.applyFilters();
  }

  // Selection methods
  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedClaims.clear();
    } else {
      this.filteredClaims.forEach(claim => this.selectedClaims.add(claim._id));
    }
    this.selectAll = !this.selectAll;
  }

  toggleClaimSelection(claimId: string): void {
    if (this.selectedClaims.has(claimId)) {
      this.selectedClaims.delete(claimId);
    } else {
      this.selectedClaims.add(claimId);
    }
    this.updateSelectAllState();
  }

  updateSelectAllState(): void {
    this.selectAll = this.filteredClaims.length > 0 && 
      this.filteredClaims.every(claim => this.selectedClaims.has(claim._id));
  }

  // Status update methods
  openStatusModal(claim: ClaimWithDetails): void {
    this.selectedClaim = claim;
    this.statusUpdate = {
      status: claim.status as any,
      notes: claim.decisionNotes || ''
    };
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedClaim = null;
    this.statusUpdate = { status: '', notes: '' };
  }

  updateClaimStatus(): void {
    if (!this.selectedClaim || !this.statusUpdate.status) return;

    this.updatingStatus = true;
    
    this.httpService.put(`/claims/${this.selectedClaim._id}/status`, this.statusUpdate)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.updatingStatus = false)
      )
      .subscribe({
        next: (response: any) => {
          // Update local data
          const claimIndex = this.claims.findIndex(c => c._id === this.selectedClaim!._id);
          if (claimIndex !== -1) {
            this.claims[claimIndex].status = this.statusUpdate.status as any;
            this.claims[claimIndex].decisionNotes = this.statusUpdate.notes;
            this.calculateStats();
            this.applyFilters();
          }
          
          this.notificationService.success('Success', 'Claim status updated successfully');
          this.closeStatusModal();
        },
        error: (error) => {
          console.error('Error updating claim status:', error);
          this.notificationService.error('Error', 'Failed to update claim status');
        }
      });
  }

  // Bulk actions
  bulkApprove(): void {
    const claimIds = Array.from(this.selectedClaims);
    if (claimIds.length === 0) return;

    this.bulkUpdateStatus(claimIds, 'APPROVED', 'Bulk approved');
  }

  bulkReject(): void {
    const claimIds = Array.from(this.selectedClaims);
    if (claimIds.length === 0) return;

    this.bulkUpdateStatus(claimIds, 'REJECTED', 'Bulk rejected');
  }

  private bulkUpdateStatus(claimIds: string[], status: string, notes: string): void {
    const updatePromises = claimIds.map(claimId => 
      this.httpService.put(`/claims/${claimId}/status`, { status, notes }).toPromise()
    );

    Promise.all(updatePromises)
      .then(() => {
        // Update local data
        claimIds.forEach(claimId => {
          const claimIndex = this.claims.findIndex(c => c._id === claimId);
          if (claimIndex !== -1) {
            this.claims[claimIndex].status = status as any;
            this.claims[claimIndex].decisionNotes = notes;
          }
        });
        
        this.calculateStats();
        this.applyFilters();
        this.selectedClaims.clear();
        this.selectAll = false;
        this.notificationService.success('Success', `${claimIds.length} claims ${status.toLowerCase()} successfully`);
      })
      .catch(error => {
        console.error('Error in bulk update:', error);
        this.notificationService.error('Error', 'Failed to update some claims');
      });
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
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
      case 'processing': return 'badge-info';
      default: return 'badge-neutral';
    }
  }

  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending Review';
      case 'rejected': return 'Rejected';
      case 'processing': return 'Processing';
      default: return status;
    }
  }

  canUpdateStatus(claim: ClaimWithDetails): boolean {
    return (claim.status as string).toLowerCase() === 'pending';
  }

  getSelectedCount(): number {
    return this.selectedClaims.size;
  }

  hasSelectedClaims(): boolean {
    return this.selectedClaims.size > 0;
  }
}
