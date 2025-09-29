import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../store';
import { selectUser } from '../../../store/auth/auth.selectors';
import { HttpService } from '../../../services/http.service';
import { NotificationService } from '../../../shared/services/notification.service';

interface AgentStats {
  assignedPolicies: number;
  assignedClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  totalCommission: number;
}

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
  status: string;
  decisionNotes?: string;
  createdAt: string;
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

interface Policy {
  _id: string;
  userId: string | {
    name: string;
    email: string;
  };
  policyProductId: string | {
    _id: string;
    title: string;
    code: string;
    premium: number;
  };
  startDate: string;
  endDate: string;
  status: string;
  premiumPaid: number;
  user?: {
    name: string;
    email: string;
  };
}

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.css'
})
export class AgentDashboardComponent implements OnInit {
  user$: Observable<any>;
  stats: AgentStats = {
    assignedPolicies: 0,
    assignedClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    totalCommission: 0
  };
  assignedClaims: Claim[] = [];
  assignedPolicies: Policy[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private store: Store<AppState>,
    private httpService: HttpService,
    private notificationService: NotificationService
  ) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    this.loadAgentData();
  }

  loadAgentData(): void {
    this.loading = true;
    this.error = null;

    console.log('Loading agent data...');

    // Load assigned claims with proper data structure handling
    this.httpService.get('/claims').subscribe({
      next: (response: any) => {
        console.log('Claims response:', response);
        this.assignedClaims = response.success ? response.data || [] : response || [];
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading claims:', error);
        this.error = 'Failed to load dashboard data';
        this.loading = false;
      }
    });

    // Load assigned policies with proper data structure handling
    this.httpService.get('/user-policies').subscribe({
      next: (response: any) => {
        console.log('Policies response:', response);
        this.assignedPolicies = response.success ? response.data || [] : response || [];
        this.calculateStats();
      },
      error: (error) => {
        console.error('Error loading policies:', error);
      }
    });
  }

  calculateStats(): void {
    console.log('Calculating agent stats with data:', {
      assignedPolicies: this.assignedPolicies.length,
      assignedClaims: this.assignedClaims.length
    });

    // Calculate assigned policies
    this.stats.assignedPolicies = this.assignedPolicies.length;

    // Calculate assigned claims
    this.stats.assignedClaims = this.assignedClaims.length;

    // Calculate pending claims
    this.stats.pendingClaims = this.assignedClaims.filter(claim => 
      claim.status === 'PENDING' || claim.status === 'pending'
    ).length;

    // Calculate approved claims
    this.stats.approvedClaims = this.assignedClaims.filter(claim => 
      claim.status === 'APPROVED' || claim.status === 'approved'
    ).length;

    // Calculate rejected claims
    this.stats.rejectedClaims = this.assignedClaims.filter(claim => 
      claim.status === 'REJECTED' || claim.status === 'rejected'
    ).length;

    // Calculate total commission (example: 5% of approved claims)
    this.stats.totalCommission = this.assignedClaims
      .filter(claim => claim.status === 'APPROVED' || claim.status === 'approved')
      .reduce((total, claim) => total + (claim.amountClaimed * 0.05), 0);

    console.log('Calculated agent stats:', this.stats);
  }

  updateClaimStatus(claimId: string, status: string, notes?: string): void {
    this.httpService.put(`/claims/${claimId}/status`, { status, notes }).subscribe({
      next: (response: any) => {
        // Update local data
        const claimIndex = this.assignedClaims.findIndex(claim => claim._id === claimId);
        if (claimIndex !== -1) {
          this.assignedClaims[claimIndex].status = status;
          this.assignedClaims[claimIndex].decisionNotes = notes;
          this.calculateStats();
        }
        this.notificationService.success('Success', `Claim ${status.toLowerCase()} successfully`);
      },
      error: (error) => {
        console.error('Error updating claim status:', error);
        this.notificationService.error('Error', 'Failed to update claim status');
      }
    });
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

  getPolicyStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'badge-success';
      case 'cancelled': return 'badge-error';
      case 'expired': return 'badge-neutral';
      default: return 'badge-neutral';
    }
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

  getPolicyTitle(policy: Policy): string {
    // Handle populated policyProductId structure
    if (typeof policy.policyProductId === 'object' && policy.policyProductId?.title) {
      return policy.policyProductId.title;
    }
    return 'Unknown Policy';
  }

  getPolicyCode(policy: Policy): string {
    // Handle populated policyProductId structure
    if (typeof policy.policyProductId === 'object' && policy.policyProductId?.code) {
      return policy.policyProductId.code;
    }
    return '';
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

  getPolicyUserName(policy: Policy): string {
    // Handle populated userId structure
    if (typeof policy.userId === 'object' && policy.userId?.name) {
      return policy.userId.name;
    }
    // Handle user object structure
    else if (policy.user?.name) {
      return policy.user.name;
    }
    return 'Unknown';
  }

  getPolicyUserEmail(policy: Policy): string {
    // Handle populated userId structure
    if (typeof policy.userId === 'object' && policy.userId?.email) {
      return policy.userId.email;
    }
    // Handle user object structure
    else if (policy.user?.email) {
      return policy.user.email;
    }
    return '';
  }
}
