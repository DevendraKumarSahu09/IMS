import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ClaimService, Claim } from '../../shared/services/claim.service';
import { NotificationService } from '../../shared/services/notification.service';
import { AppState } from '../../store';
import { selectUser } from '../../store/auth/auth.selectors';

@Component({
  selector: 'app-claims',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './claims.component.html',
  styleUrl: './claims.component.css'
})
export class ClaimsComponent implements OnInit, OnDestroy {
  claims: Claim[] = [];
  filteredClaims: Claim[] = [];
  loading = true;
  error: string | null = null;
  
  // Filter and search properties
  searchQuery = '';
  selectedStatus = '';
  sortBy = 'newest';
  
  // Statistics
  stats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    processing: 0,
    totalAmount: 0,
    approvedAmount: 0
  };

  // User state
  user$: Observable<any>;

  private destroy$ = new Subject<void>();

  constructor(
    private claimService: ClaimService,
    private notificationService: NotificationService,
    private router: Router,
    private store: Store<AppState>
  ) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    // Check if user is an agent and redirect to agent claims page
    this.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user && user.role === 'agent') {
        this.router.navigate(['/agent/claims']);
        return;
      }
    });
    
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
          this.filteredClaims = [...this.claims];
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
        claim.description.toLowerCase().includes(query) ||
        claim.amountClaimed.toString().includes(query)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(claim => 
        claim.status.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount-high':
          return b.amountClaimed - a.amountClaimed;
        case 'amount-low':
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

  onStatusChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.sortBy = 'newest';
    this.applyFilters();
  }

  refreshData(): void {
    this.loadClaims();
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.searchQuery) count++;
    if (this.selectedStatus) count++;
    if (this.sortBy !== 'newest') count++;
    return count;
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
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

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'M5 13l4 4L19 7';
      case 'pending': return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'rejected': return 'M6 18L18 6M6 6l12 12';
      case 'processing': return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15';
      default: return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    }
  }

  getPolicyDisplayName(claim: Claim): string {
    // Handle populated userPolicyId structure
    if (typeof claim.userPolicyId === 'object' && claim.userPolicyId?.policyProductId?.title) {
      return claim.userPolicyId.policyProductId.title;
    }
    return 'Insurance Policy';
  }

  getDaysSinceSubmission(claim: Claim): number {
    const now = new Date();
    const submissionDate = new Date(claim.createdAt);
    const diffTime = Math.abs(now.getTime() - submissionDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  viewClaimDetails(claimId: string): void {
    this.router.navigate(['/claims', claimId]);
  }
}
