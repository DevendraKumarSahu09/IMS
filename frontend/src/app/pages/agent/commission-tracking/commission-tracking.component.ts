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

interface CommissionRecord {
  _id: string;
  agentId: string;
  policyId: string;
  customerId: string;
  customerName: string;
  policyTitle: string;
  policyCode: string;
  premiumAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  paymentDate?: string;
  createdAt: string;
  month: string;
  year: number;
}

interface CommissionFilters {
  search: string;
  status: string;
  month: string;
  year: string;
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

interface CommissionStats {
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  cancelledCommission: number;
  thisMonthCommission: number;
  lastMonthCommission: number;
  totalPolicies: number;
  averageCommission: number;
}

interface MonthlyCommission {
  month: string;
  year: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  policyCount: number;
}

@Component({
  selector: 'app-agent-commission-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './commission-tracking.component.html',
  styleUrl: './commission-tracking.component.css'
})
export class AgentCommissionTrackingComponent implements OnInit, OnDestroy {
  user$: Observable<any>;
  commissions: CommissionRecord[] = [];
  monthlyData: MonthlyCommission[] = [];
  loading = true;
  error: string | null = null;
  pagination: PaginationInfo = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };
  filters: CommissionFilters = {
    search: '',
    status: '',
    month: '',
    year: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };
  stats: CommissionStats = {
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0,
    cancelledCommission: 0,
    thisMonthCommission: 0,
    lastMonthCommission: 0,
    totalPolicies: 0,
    averageCommission: 0
  };
  selectedCommissions: string[] = [];
  viewingCommission: CommissionRecord | null = null;
  showCommissionModal = false;
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

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
    this.loadCommissions();
    this.loadStats();
    this.loadMonthlyData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCommissions(): void {
    this.loading = true;
    this.error = null;

    // For now, we'll simulate commission data since we don't have a dedicated API
    // In a real implementation, this would call a commission API
    this.simulateCommissionData();
  }

  simulateCommissionData(): void {
    // Simulate commission data based on user policies
    this.httpService.get('/user-policies').subscribe({
      next: (response: any) => {
        const policies = response.success ? response.data || [] : response || [];
        this.commissions = this.generateCommissionData(policies);
        this.pagination = {
          page: 1,
          limit: 10,
          total: this.commissions.length,
          pages: Math.ceil(this.commissions.length / 10)
        };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading policies for commission calculation:', error);
        this.error = 'Failed to load commission data';
        this.loading = false;
        this.notificationService.error('Error', 'Failed to load commission data');
      }
    });
  }

  generateCommissionData(policies: any[]): CommissionRecord[] {
    const commissions: CommissionRecord[] = [];
    const currentDate = new Date();
    
    policies.forEach((policy, index) => {
      const policyDate = new Date(policy.createdAt);
      const month = policyDate.getMonth() + 1;
      const year = policyDate.getFullYear();
      
      // Generate commission records for the last 12 months
      for (let i = 0; i < 12; i++) {
        const recordDate = new Date(year, month - 1 - i, 1);
        if (recordDate > new Date(currentDate.getFullYear(), currentDate.getMonth() - 12, 1)) {
          const commissionRate = 0.05; // 5% commission
          const commissionAmount = (policy.premiumPaid || 0) * commissionRate;
          
          commissions.push({
            _id: `commission_${policy._id}_${i}`,
            agentId: 'current_agent',
            policyId: policy._id,
            customerId: typeof policy.userId === 'object' ? policy.userId._id : policy.userId,
            customerName: typeof policy.userId === 'object' ? policy.userId.name : 'Unknown',
            policyTitle: typeof policy.policyProductId === 'object' ? policy.policyProductId.title : 'Unknown Policy',
            policyCode: typeof policy.policyProductId === 'object' ? policy.policyProductId.code : 'N/A',
            premiumAmount: policy.premiumPaid || 0,
            commissionRate: commissionRate,
            commissionAmount: commissionAmount,
            status: this.getRandomStatus(),
            paymentDate: this.getRandomPaymentDate(),
            createdAt: recordDate.toISOString(),
            month: recordDate.toLocaleString('default', { month: 'long' }),
            year: recordDate.getFullYear()
          });
        }
      }
    });
    
    return commissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getRandomStatus(): 'PENDING' | 'PAID' | 'CANCELLED' {
    const statuses = ['PENDING', 'PAID', 'CANCELLED'];
    const weights = [0.2, 0.7, 0.1]; // 20% pending, 70% paid, 10% cancelled
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < statuses.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return statuses[i] as 'PENDING' | 'PAID' | 'CANCELLED';
      }
    }
    
    return 'PENDING';
  }

  getRandomPaymentDate(): string | undefined {
    const random = Math.random();
    if (random > 0.3) { // 70% chance of having a payment date
      const daysAgo = Math.floor(Math.random() * 90); // Random date within last 90 days
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString();
    }
    return undefined;
  }

  loadStats(): void {
    // Calculate stats from current commissions
    this.stats = {
      totalCommission: this.commissions.reduce((total, c) => total + c.commissionAmount, 0),
      paidCommission: this.commissions.filter(c => c.status === 'PAID').reduce((total, c) => total + c.commissionAmount, 0),
      pendingCommission: this.commissions.filter(c => c.status === 'PENDING').reduce((total, c) => total + c.commissionAmount, 0),
      cancelledCommission: this.commissions.filter(c => c.status === 'CANCELLED').reduce((total, c) => total + c.commissionAmount, 0),
      thisMonthCommission: this.commissions
        .filter(c => c.year === this.currentYear && c.month === this.getMonthName(this.currentMonth))
        .reduce((total, c) => total + c.commissionAmount, 0),
      lastMonthCommission: this.commissions
        .filter(c => c.year === this.currentYear && c.month === this.getMonthName(this.currentMonth - 1))
        .reduce((total, c) => total + c.commissionAmount, 0),
      totalPolicies: this.commissions.length,
      averageCommission: this.commissions.length > 0 ? this.commissions.reduce((total, c) => total + c.commissionAmount, 0) / this.commissions.length : 0
    };
  }

  loadMonthlyData(): void {
    // Generate monthly commission data for the last 12 months
    this.monthlyData = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      
      const monthCommissions = this.commissions.filter(c => 
        c.year === year && c.month === monthName
      );
      
      this.monthlyData.push({
        month: monthName,
        year: year,
        totalCommission: monthCommissions.reduce((total, c) => total + c.commissionAmount, 0),
        paidCommission: monthCommissions.filter(c => c.status === 'PAID').reduce((total, c) => total + c.commissionAmount, 0),
        pendingCommission: monthCommissions.filter(c => c.status === 'PENDING').reduce((total, c) => total + c.commissionAmount, 0),
        policyCount: monthCommissions.length
      });
    }
  }

  getMonthName(monthNumber: number): string {
    const date = new Date(2024, monthNumber - 1, 1);
    return date.toLocaleString('default', { month: 'long' });
  }

  applyFilters(): void {
    this.pagination.page = 1; // Reset to first page
    this.loadCommissions();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: '',
      month: '',
      year: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.pagination.page = page;
    this.loadCommissions();
  }

  onLimitChange(limit: number): void {
    this.pagination.limit = limit;
    this.pagination.page = 1;
    this.loadCommissions();
  }

  selectCommission(commissionId: string): void {
    const index = this.selectedCommissions.indexOf(commissionId);
    if (index > -1) {
      this.selectedCommissions.splice(index, 1);
    } else {
      this.selectedCommissions.push(commissionId);
    }
  }

  selectAllCommissions(): void {
    if (this.selectedCommissions.length === this.commissions.length) {
      this.selectedCommissions = [];
    } else {
      this.selectedCommissions = this.commissions.map(commission => commission._id);
    }
  }

  viewCommission(commission: CommissionRecord): void {
    this.viewingCommission = commission;
    this.showCommissionModal = true;
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
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'cancelled': return 'badge-error';
      default: return 'badge-neutral';
    }
  }

  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filters.search.trim()) count++;
    if (this.filters.status) count++;
    if (this.filters.month) count++;
    if (this.filters.year) count++;
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

  getCommissionPercentage(): number {
    if (this.stats.totalCommission === 0) return 0;
    return (this.stats.thisMonthCommission / this.stats.totalCommission) * 100;
  }

  getGrowthPercentage(): number {
    if (this.stats.lastMonthCommission === 0) return 0;
    return ((this.stats.thisMonthCommission - this.stats.lastMonthCommission) / this.stats.lastMonthCommission) * 100;
  }

  getChartBarHeight(commission: number): number {
    if (this.monthlyData.length === 0) return 0;
    const maxCommission = Math.max(...this.monthlyData.map(m => m.totalCommission));
    if (maxCommission === 0) return 0;
    return (commission / maxCommission) * 200;
  }
}
