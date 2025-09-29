import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ClaimService, Claim } from '../../../shared/services/claim.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-claim-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './claim-detail.component.html',
  styleUrl: './claim-detail.component.css'
})
export class ClaimDetailComponent implements OnInit, OnDestroy {
  claim: Claim | null = null;
  loading = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private claimService: ClaimService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadClaim();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClaim(): void {
    const claimId = this.route.snapshot.paramMap.get('id');
    console.log('Loading claim with ID:', claimId);
    
    if (!claimId) {
      this.error = 'Claim ID not provided';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    this.claimService.getClaim(claimId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (claim) => {
          console.log('Claim loaded successfully:', claim);
          this.claim = claim;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading claim:', error);
          this.error = 'Failed to load claim details';
          this.loading = false;
          this.notificationService.error('Error', 'Failed to load claim details');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/claims']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString('en-US', {
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

  getPolicyDisplayName(claim: Claim): string {
    // Handle populated userPolicyId structure
    if (typeof claim.userPolicyId === 'object' && claim.userPolicyId?.policyProductId?.title) {
      return claim.userPolicyId.policyProductId.title;
    }
    return 'Insurance Policy';
  }

  getPolicyCode(claim: Claim): string {
    // Handle populated userPolicyId structure
    if (typeof claim.userPolicyId === 'object' && claim.userPolicyId?.policyProductId?.code) {
      return claim.userPolicyId.policyProductId.code;
    }
    return 'N/A';
  }

  getDaysSinceSubmission(claim: Claim): number {
    const now = new Date();
    const submissionDate = new Date(claim.createdAt);
    const diffTime = Math.abs(now.getTime() - submissionDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
