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

interface PolicyAssignment {
  _id: string;
  userId: string | {
    name: string;
    email: string;
  };
  policyProductId: string | {
    _id: string;
    title: string;
    code: string;
    description: string;
    minSumInsured: number;
    maxSumInsured: number;
    premium: number;
  };
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING';
  premiumPaid: number;
  assignedAgentId?: string | {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt?: string;
  user?: {
    name: string;
    email: string;
  };
  policyProduct?: {
    title: string;
    code: string;
    description: string;
    minSumInsured: number;
    maxSumInsured: number;
    premium: number;
  };
}

interface AssignmentFilters {
  search: string;
  status: string;
  policyType: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface AssignmentStats {
  totalAssignments: number;
  activeAssignments: number;
  pendingAssignments: number;
  expiredAssignments: number;
  totalPremium: number;
  totalCommission: number;
}

@Component({
  selector: 'app-agent-policy-assignment',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './policy-assignment.component.html',
  styleUrl: './policy-assignment.component.css'
})
export class AgentPolicyAssignmentComponent implements OnInit, OnDestroy {
  user$: Observable<any>;
  assignments: PolicyAssignment[] = [];
  loading = true;
  error: string | null = null;
  pagination: PaginationInfo = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };
  filters: AssignmentFilters = {
    search: '',
    status: '',
    policyType: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };
  stats: AssignmentStats = {
    totalAssignments: 0,
    activeAssignments: 0,
    pendingAssignments: 0,
    expiredAssignments: 0,
    totalPremium: 0,
    totalCommission: 0
  };
  selectedAssignments: string[] = [];
  viewingAssignment: PolicyAssignment | null = null;
  showAssignmentModal = false;

  // Make Math available in template
  Math = Math;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private httpService: HttpService,
    private notificationService: NotificationService
  ) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    this.loadAssignments();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAssignments(): void {
    this.loading = true;
    this.error = null;

    const params = {
      page: this.pagination.page,
      limit: this.pagination.limit,
      ...this.filters
    };

    // Remove empty filters
    Object.keys(params).forEach(key => {
      if ((params as any)[key] === '' || (params as any)[key] === null) {
        delete (params as any)[key];
      }
    });

    // Build query string
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      const value = (params as any)[key];
      if (value !== '' && value !== null && value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/user-policies?${queryString}` : '/user-policies';
    
    this.httpService.get(endpoint).subscribe({
      next: (response: any) => {
        console.log('Assignments response:', response);
        this.assignments = response.success ? response.data || [] : response || [];
        this.pagination = response.pagination || this.pagination;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading assignments:', error);
        this.error = 'Failed to load policy assignments';
        this.loading = false;
        this.notificationService.error('Error', 'Failed to load policy assignments');
      }
    });
  }

  loadStats(): void {
    // Calculate stats from current assignments
    this.stats = {
      totalAssignments: this.assignments.length,
      activeAssignments: this.assignments.filter(a => a.status === 'ACTIVE').length,
      pendingAssignments: this.assignments.filter(a => a.status === 'PENDING').length,
      expiredAssignments: this.assignments.filter(a => a.status === 'EXPIRED').length,
      totalPremium: this.assignments.reduce((total, a) => total + (a.premiumPaid || 0), 0),
      totalCommission: this.assignments
        .filter(a => a.status === 'ACTIVE')
        .reduce((total, a) => total + (a.premiumPaid * 0.05 || 0), 0) // 5% commission
    };
  }

  applyFilters(): void {
    this.pagination.page = 1; // Reset to first page
    this.loadAssignments();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: '',
      policyType: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.pagination.page = page;
    this.loadAssignments();
  }

  onLimitChange(limit: number): void {
    this.pagination.limit = limit;
    this.pagination.page = 1;
    this.loadAssignments();
  }

  selectAssignment(assignmentId: string): void {
    const index = this.selectedAssignments.indexOf(assignmentId);
    if (index > -1) {
      this.selectedAssignments.splice(index, 1);
    } else {
      this.selectedAssignments.push(assignmentId);
    }
  }

  selectAllAssignments(): void {
    if (this.selectedAssignments.length === this.assignments.length) {
      this.selectedAssignments = [];
    } else {
      this.selectedAssignments = this.assignments.map(assignment => assignment._id);
    }
  }

  viewAssignment(assignment: PolicyAssignment): void {
    this.viewingAssignment = assignment;
    this.showAssignmentModal = true;
  }

  updateAssignmentStatus(assignmentId: string, status: string): void {
    this.httpService.put(`/user-policies/${assignmentId}`, { status })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadAssignments())
      )
      .subscribe({
        next: (response: any) => {
          this.notificationService.success('Success', `Assignment ${status.toLowerCase()} successfully`);
        },
        error: (error) => {
          console.error('Error updating assignment status:', error);
          this.notificationService.error('Error', 'Failed to update assignment status');
        }
      });
  }

  getAssignmentUserName(assignment: PolicyAssignment): string {
    // Handle populated userId structure
    if (typeof assignment.userId === 'object' && assignment.userId?.name) {
      return assignment.userId.name;
    }
    // Handle user object structure
    else if (assignment.user?.name) {
      return assignment.user.name;
    }
    return 'Unknown';
  }

  getAssignmentUserEmail(assignment: PolicyAssignment): string {
    // Handle populated userId structure
    if (typeof assignment.userId === 'object' && assignment.userId?.email) {
      return assignment.userId.email;
    }
    // Handle user object structure
    else if (assignment.user?.email) {
      return assignment.user.email;
    }
    return '';
  }

  getAssignmentPolicyTitle(assignment: PolicyAssignment): string {
    // Handle populated policyProductId structure
    if (typeof assignment.policyProductId === 'object' && assignment.policyProductId?.title) {
      return assignment.policyProductId.title;
    }
    // Handle policyProduct object structure
    else if (assignment.policyProduct?.title) {
      return assignment.policyProduct.title;
    }
    return 'Unknown Policy';
  }

  getAssignmentPolicyCode(assignment: PolicyAssignment): string {
    // Handle populated policyProductId structure
    if (typeof assignment.policyProductId === 'object' && assignment.policyProductId?.code) {
      return assignment.policyProductId.code;
    }
    // Handle policyProduct object structure
    else if (assignment.policyProduct?.code) {
      return assignment.policyProduct.code;
    }
    return '';
  }

  getAssignmentPolicyDescription(assignment: PolicyAssignment): string {
    // Handle populated policyProductId structure
    if (typeof assignment.policyProductId === 'object' && assignment.policyProductId?.description) {
      return assignment.policyProductId.description;
    }
    // Handle policyProduct object structure
    else if (assignment.policyProduct?.description) {
      return assignment.policyProduct.description;
    }
    return 'No description available';
  }

  getAssignmentCoverage(assignment: PolicyAssignment): number {
    // Handle populated policyProductId structure
    if (typeof assignment.policyProductId === 'object' && assignment.policyProductId?.minSumInsured) {
      return assignment.policyProductId.minSumInsured;
    }
    // Handle policyProduct object structure
    else if (assignment.policyProduct?.minSumInsured) {
      return assignment.policyProduct.minSumInsured;
    }
    return 0;
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
      case 'active': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'cancelled': return 'badge-error';
      case 'expired': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  }

  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      case 'expired': return 'Expired';
      default: return status;
    }
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filters.search.trim()) count++;
    if (this.filters.status) count++;
    if (this.filters.policyType) count++;
    if (this.filters.dateFrom) count++;
    if (this.filters.dateTo) count++;
    return count;
  }

  getSortIcon(field: string): string {
    if (this.filters.sortBy !== field) return '↕️';
    return this.filters.sortOrder === 'asc' ? '↑' : '↓';
  }

  sortBy(field: string): void {
    if (this.filters.sortBy === field) {
      this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sortBy = field;
      this.filters.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  isAssignmentExpiringSoon(assignment: PolicyAssignment): boolean {
    if (assignment.status !== 'ACTIVE') return false;
    const endDate = new Date(assignment.endDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return endDate <= thirtyDaysFromNow && endDate > new Date();
  }

  getDaysUntilExpiry(assignment: PolicyAssignment): number {
    const endDate = new Date(assignment.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
