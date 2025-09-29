import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { PaymentService, Payment } from '../../shared/services/payment.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent implements OnInit, OnDestroy {
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  loading = true;
  error: string | null = null;
  
  // Filter and search properties
  searchQuery = '';
  selectedStatus = '';
  selectedMethod = '';
  sortBy = 'newest';
  
  // Statistics
  stats = {
    total: 0,
    successful: 0,
    pending: 0,
    failed: 0,
    cancelled: 0,
    totalAmount: 0,
    successfulAmount: 0
  };

  private destroy$ = new Subject<void>();

  constructor(
    private paymentService: PaymentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPayments(): void {
    this.loading = true;
    this.error = null;

    console.log('Loading payments...');
    this.paymentService.getUserPayments()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (payments) => {
          console.log('✅ Payments loaded successfully:', payments);
          console.log('Number of payments:', payments.length);
          this.payments = payments;
          this.calculateStats();
          this.applyFilters();
        },
        error: (error) => {
          console.error('❌ Error loading payments:', error);
          console.error('Error details:', error.error);
          console.error('Error status:', error.status);
          this.error = 'Failed to load payments';
          this.notificationService.error('Error', 'Failed to load payments');
        }
      });
  }

  calculateStats(): void {
    this.stats = this.paymentService.calculatePaymentStats(this.payments);
    console.log('Calculated stats:', this.stats);
  }

  applyFilters(): void {
    let filtered = [...this.payments];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(payment => 
        payment._id.toLowerCase().includes(query) ||
        payment.transactionId?.toLowerCase().includes(query) ||
        payment.method.toLowerCase().includes(query) ||
        payment.amount.toString().includes(query)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(payment => 
        (payment.paymentStatus || 'PENDING')?.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }

    // Method filter
    if (this.selectedMethod) {
      filtered = filtered.filter(payment => 
        payment.method.toLowerCase() === this.selectedMethod.toLowerCase()
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
          return b.amount - a.amount;
        case 'amount-low':
          return a.amount - b.amount;
        case 'status':
          return (a.paymentStatus || '').localeCompare(b.paymentStatus || '');
        default:
          return 0;
      }
    });

    this.filteredPayments = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  onMethodChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedMethod = '';
    this.sortBy = 'newest';
    this.applyFilters();
  }

  refreshPayments(): void {
    this.loadPayments();
  }

  refreshData(): void {
    console.log('Refreshing payments data...');
    this.loadPayments();
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.searchQuery.trim()) count++;
    if (this.selectedStatus) count++;
    if (this.selectedMethod) count++;
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

  getPolicyDisplayName(payment: Payment): string {
    console.log('getPolicyDisplayName - payment:', payment);
    console.log('getPolicyDisplayName - userPolicyId:', payment.userPolicyId);
    
    // Backend returns userPolicyId populated as an object with policyProductId
    if (typeof payment.userPolicyId === 'object' && payment.userPolicyId.policyProductId) {
      if (typeof payment.userPolicyId.policyProductId === 'object' && payment.userPolicyId.policyProductId.title) {
        return payment.userPolicyId.policyProductId.title;
      }
    }
    
    return 'Insurance Policy';
  }

  getThisMonthPayments(): number {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    return this.payments.filter(payment => {
      const paymentDate = new Date(payment.createdAt);
      return paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear;
    }).length;
  }

  getThisMonthAmount(): number {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    return this.payments
      .filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear;
      })
      .reduce((sum, payment) => sum + payment.amount, 0);
  }

  getAveragePayment(): number {
    if (this.payments.length === 0) return 0;
    return this.stats.totalAmount / this.payments.length;
  }

  getDaysSincePayment(payment: Payment): number {
    const now = new Date();
    const paymentDate = new Date(payment.createdAt);
    const diffTime = Math.abs(now.getTime() - paymentDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getPaymentStatusIcon(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'PENDING':
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'FAILED':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPaymentMethodColor(method: string): string {
    switch (method) {
      case 'CARD':
        return 'bg-blue-100 text-blue-800';
      case 'NETBANKING':
        return 'bg-purple-100 text-purple-800';
      case 'OFFLINE':
        return 'bg-gray-100 text-gray-800';
      case 'SIMULATED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}