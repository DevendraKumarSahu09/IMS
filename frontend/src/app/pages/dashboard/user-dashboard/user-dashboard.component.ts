import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest, forkJoin } from 'rxjs';
import { takeUntil, finalize, tap } from 'rxjs/operators';
import { AppState } from '../../../store';
import { selectUser } from '../../../store/auth/auth.selectors';
import { PolicyService, UserPolicy } from '../../../shared/services/policy.service';
import { ClaimService } from '../../../shared/services/claim.service';
import { PaymentService } from '../../../shared/services/payment.service';
import { NotificationService } from '../../../shared/services/notification.service';

interface DashboardStats {
  activePolicies: number;
  totalCoverage: number;
  pendingClaims: number;
  monthlyPremium: number;
  expiringSoon: number;
  totalClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  user$: Observable<any>;
  userPolicies: UserPolicy[] = [];
  claims: any[] = [];
  loading = true;
  error: string | null = null;
  
  stats: DashboardStats = {
    activePolicies: 0,
    totalCoverage: 0,
    pendingClaims: 0,
    monthlyPremium: 0,
    expiringSoon: 0,
    totalClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0
  };

  quickActions: QuickAction[] = [
    {
      title: 'Browse Policies',
      description: 'Explore new insurance options',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      route: '/policies',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'My Policies',
      description: 'View your purchased policies',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      route: '/policies/my-policies',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Submit Claim',
      description: 'File a new insurance claim',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      route: '/claims/submit',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'View Claims',
      description: 'Track your claim status',
      icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      route: '/claims',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Make Payment',
      description: 'Pay your insurance premium',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      route: '/payments/record',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'View Payments',
      description: 'Track your payment history',
      icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      route: '/payments',
      color: 'from-cyan-500 to-cyan-600'
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private policyService: PolicyService,
    private claimService: ClaimService,
    private paymentService: PaymentService,
    private notificationService: NotificationService
  ) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;
    
    console.log('Loading dashboard data...');
    
    // Load user policies, claims, and payments in parallel
    forkJoin({
      policies: this.policyService.getUserPolicies().pipe(
        tap((policies: UserPolicy[]) => console.log('Policies loaded:', policies.length))
      ),
      claims: this.claimService.getClaims().pipe(
        tap((claims: any[]) => console.log('Claims loaded:', claims.length))
      ),
      payments: this.paymentService.getPayments().pipe(
        tap((payments: any[]) => console.log('Payments loaded:', payments.length))
      )
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (data: any) => {
        console.log('Dashboard data loaded successfully:', data);
        console.log('Policies data:', data.policies);
        console.log('Claims data:', data.claims);
        this.userPolicies = data.policies || [];
        this.claims = data.claims || [];
        this.calculateStats();
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Failed to load dashboard data. Please try again.';
        this.notificationService.error('Error', 'Failed to load dashboard data');
      }
    });
  }

  calculateStats(): void {
    console.log('Calculating stats with data:', {
      userPolicies: this.userPolicies.length,
      claims: this.claims.length
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    // Calculate active policies
    this.stats.activePolicies = this.userPolicies.filter(policy => {
      const isActive = policy.status === 'ACTIVE';
      console.log(`Policy ${policy._id}: status=${policy.status}, isActive=${isActive}`);
      return isActive;
    }).length;

    // Calculate total coverage - handle both populated and unpopulated data structures
    this.stats.totalCoverage = this.userPolicies
      .filter(policy => policy.status === 'ACTIVE')
      .reduce((total, policy) => {
        let coverage = 0;
        
        // Handle populated policyProductId (from backend population)
        if (typeof policy.policyProductId === 'object' && policy.policyProductId?.minSumInsured) {
          coverage = policy.policyProductId.minSumInsured;
        }
        // Handle populated policyProduct (alternative structure)
        else if (policy.policyProduct?.minSumInsured) {
          coverage = policy.policyProduct.minSumInsured;
        }
        
        console.log(`Policy ${policy._id} coverage: ${coverage}`);
        return total + coverage;
      }, 0);

    // Calculate monthly premium
    this.stats.monthlyPremium = this.userPolicies
      .filter(policy => policy.status === 'ACTIVE')
      .reduce((total, policy) => {
        const premium = policy.premiumPaid || 0;
        console.log(`Policy ${policy._id} premium: ${premium}`);
        return total + premium;
      }, 0);

    // Calculate expiring soon (within 30 days)
    this.stats.expiringSoon = this.userPolicies.filter(policy => {
      if (policy.status !== 'ACTIVE') return false;
      const endDate = new Date(policy.endDate);
      const isExpiringSoon = endDate <= thirtyDaysFromNow && endDate > now;
      console.log(`Policy ${policy._id} expiring soon: ${isExpiringSoon}, endDate: ${policy.endDate}`);
      return isExpiringSoon;
    }).length;

    // Calculate claim statistics
    this.stats.totalClaims = this.claims.length;
    this.stats.pendingClaims = this.claims.filter(claim => 
      claim.status === 'PENDING'
    ).length;
    this.stats.approvedClaims = this.claims.filter(claim => 
      claim.status === 'APPROVED'
    ).length;
    this.stats.rejectedClaims = this.claims.filter(claim => 
      claim.status === 'REJECTED'
    ).length;

    console.log('Calculated stats:', this.stats);
  }

  formatCurrency(amount: number): string {
    return this.policyService.formatCurrency(amount);
  }

  getStatusColor(status: string): string {
    return this.policyService.getStatusColor(status);
  }

  getClaimStatusColor(status: string): string {
    return this.claimService.getStatusColor(status);
  }

  getDaysUntilExpiry(policy: UserPolicy): number {
    return this.policyService.getDaysUntilExpiry(policy);
  }

  isPolicyExpiringSoon(policy: UserPolicy): boolean {
    return this.getDaysUntilExpiry(policy) <= 30 && this.getDaysUntilExpiry(policy) > 0;
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  getRecentPolicies(): UserPolicy[] {
    return this.userPolicies
      .filter(policy => policy.status === 'ACTIVE')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }

  getRecentClaims(): any[] {
    return this.claims
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }

  getPolicyDisplayName(policy: UserPolicy): string {
    // Handle populated policyProductId (from backend population)
    if (typeof policy.policyProductId === 'object' && policy.policyProductId?.title) {
      return policy.policyProductId.title;
    }
    // Handle populated policyProduct (alternative structure)
    else if (policy.policyProduct?.title) {
      return policy.policyProduct.title;
    }
    return 'Insurance Policy';
  }

  getPolicyCoverage(policy: UserPolicy): number {
    // Handle populated policyProductId (from backend population)
    if (typeof policy.policyProductId === 'object' && policy.policyProductId?.minSumInsured) {
      return policy.policyProductId.minSumInsured;
    }
    // Handle populated policyProduct (alternative structure)
    else if (policy.policyProduct?.minSumInsured) {
      return policy.policyProduct.minSumInsured;
    }
    return 0;
  }

  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

