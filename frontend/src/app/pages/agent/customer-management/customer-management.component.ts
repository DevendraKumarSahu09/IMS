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

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  assignedPolicies?: number;
  totalClaims?: number;
  totalPayments?: number;
}

interface CustomerFilters {
  search: string;
  status: string;
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

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  totalPolicies: number;
  totalClaims: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-agent-customer-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-management.component.html',
  styleUrl: './customer-management.component.css'
})
export class AgentCustomerManagementComponent implements OnInit, OnDestroy {
  user$: Observable<any>;
  customers: Customer[] = [];
  loading = true;
  error: string | null = null;
  pagination: PaginationInfo = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };
  filters: CustomerFilters = {
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };
  stats: CustomerStats = {
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomers: 0,
    totalPolicies: 0,
    totalClaims: 0,
    totalRevenue: 0
  };
  selectedCustomers: string[] = [];
  viewingCustomer: Customer | null = null;
  showCustomerModal = false;

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
    this.loadCustomers();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCustomers(): void {
    this.loading = true;
    this.error = null;

    const params = {
      page: this.pagination.page,
      limit: this.pagination.limit,
      role: 'customer', // Only load customers
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
    const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
    
    this.httpService.get(endpoint).subscribe({
      next: (response: any) => {
        console.log('Customers response:', response);
        this.customers = response.success ? response.data || [] : response || [];
        this.pagination = response.pagination || this.pagination;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.error = 'Failed to load customers';
        this.loading = false;
        this.notificationService.error('Error', 'Failed to load customers');
      }
    });
  }

  loadStats(): void {
    // Load customer statistics
    this.httpService.get('/admin/summary').subscribe({
      next: (response: any) => {
        this.stats = {
          totalCustomers: response.totalUsers || 0,
          activeCustomers: response.totalUsers || 0, // This would need a separate API
          newCustomers: 0, // This would need a separate API
          totalPolicies: response.totalPolicies || 0,
          totalClaims: response.pendingClaims || 0,
          totalRevenue: response.totalPayments || 0
        };
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  applyFilters(): void {
    this.pagination.page = 1; // Reset to first page
    this.loadCustomers();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.pagination.page = page;
    this.loadCustomers();
  }

  onLimitChange(limit: number): void {
    this.pagination.limit = limit;
    this.pagination.page = 1;
    this.loadCustomers();
  }

  selectCustomer(customerId: string): void {
    const index = this.selectedCustomers.indexOf(customerId);
    if (index > -1) {
      this.selectedCustomers.splice(index, 1);
    } else {
      this.selectedCustomers.push(customerId);
    }
  }

  selectAllCustomers(): void {
    if (this.selectedCustomers.length === this.customers.length) {
      this.selectedCustomers = [];
    } else {
      this.selectedCustomers = this.customers.map(customer => customer._id);
    }
  }

  viewCustomer(customer: Customer): void {
    this.viewingCustomer = customer;
    this.showCustomerModal = true;
  }

  assignToCustomer(customerId: string): void {
    // This would open a modal to assign policies or tasks to the customer
    this.notificationService.info('Info', 'Assignment feature coming soon');
  }

  contactCustomer(customer: Customer): void {
    // This would open a contact modal or redirect to communication
    this.notificationService.info('Info', `Contacting ${customer.name} at ${customer.email}`);
  }

  getCustomerInitials(customer: Customer): string {
    return customer.name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  getStatusColor(isActive: boolean): string {
    return isActive ? 'badge-success' : 'badge-error';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filters.search.trim()) count++;
    if (this.filters.status) count++;
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
}
