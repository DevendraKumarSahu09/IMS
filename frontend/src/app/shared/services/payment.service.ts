import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';

export interface Payment {
  _id: string;
  userId: string | any;
  userPolicyId: string | any | {
    _id: string;
    policyProductId: string | any | {
      _id: string;
      title: string;
      minSumInsured: number;
    };
    startDate: Date | string;
    endDate: Date | string;
    premiumPaid: number;
    status: string;
  };
  amount: number;
  method: 'CARD' | 'NETBANKING' | 'OFFLINE' | 'SIMULATED';
  paymentMethod: 'CARD' | 'NETBANKING' | 'OFFLINE' | 'SIMULATED'; // For backward compatibility
  reference: string;
  transactionId?: string;
  paymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
  paidAt?: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface PaymentRequest {
  userPolicyId: string;
  amount: number;
  method: 'CARD' | 'NETBANKING' | 'OFFLINE' | 'SIMULATED';
  reference: string;
  paymentMethod?: string;
  paymentDetails?: any;
}

export interface PaymentMethodOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export type PaymentMethod = 'CARD' | 'NETBANKING' | 'OFFLINE' | 'SIMULATED';

export interface PaymentSubmissionRequest {
  userPolicyId: string;
  amount: number;
  method: 'CARD' | 'NETBANKING' | 'OFFLINE' | 'SIMULATED';
  reference: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor(private apiService: ApiService) { }

  // Get payments for current user
  getPayments(): Observable<Payment[]> {
    console.log('PaymentService: Calling API /payments/user');
    return this.apiService.get<Payment[]>('/payments/user').pipe(
      map(response => {
        console.log('PaymentService: API response:', response);
        console.log('PaymentService: Response data:', response.data);
        return response.data || [];
      })
    );
  }

  // Get user payments (alias for getPayments)
  getUserPayments(): Observable<Payment[]> {
    console.log('PaymentService: Getting user payments...');
    return this.getPayments();
  }

  // Submit a new payment
  submitPayment(paymentData: PaymentSubmissionRequest): Observable<Payment> {
    return this.apiService.post<Payment>('/payments', paymentData).pipe(
      map(response => response.data!)
    );
  }

  // Create payment (alias for submitPayment)
  createPayment(paymentData: PaymentRequest): Observable<Payment> {
    return this.submitPayment(paymentData);
  }

  // Get payment by ID
  getPaymentById(id: string): Observable<Payment> {
    return this.apiService.get<Payment>(`/payments/${id}`).pipe(
      map(response => response.data!)
    );
  }

  // Calculate payment statistics
  calculatePaymentStats(payments: Payment[]): any {
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;
    
    const methodStats = payments.reduce((stats, payment) => {
      stats[payment.method] = (stats[payment.method] || 0) + 1;
      return stats;
    }, {} as any);

    return {
      totalPayments,
      totalAmount,
      averageAmount,
      methodStats
    };
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Generate payment reference
  generatePaymentReference(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PAY-${timestamp}-${random}`;
  }

  // Get payment methods
  getPaymentMethods(): PaymentMethodOption[] {
    return [
      {
        id: 'card',
        name: 'Credit/Debit Card',
        description: 'Pay with your credit or debit card',
        icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
      },
      {
        id: 'upi',
        name: 'UPI',
        description: 'Pay using UPI ID or QR code',
        icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
      },
      {
        id: 'netbanking',
        name: 'Net Banking',
        description: 'Pay using your bank account',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
      },
      {
        id: 'wallet',
        name: 'Digital Wallet',
        description: 'Pay using digital wallet',
        icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
      }
    ];
  }

  // Check if payment is due for a policy
  isPaymentDue(policy: any): boolean {
    if (!policy || !policy.endDate) return false;
    const endDate = new Date(policy.endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30; // Payment due if policy expires within 30 days
  }

  // Calculate next payment date
  calculateNextPaymentDate(policy: any): Date | null {
    if (!policy || !policy.endDate) return null;
    const endDate = new Date(policy.endDate);
    const nextPayment = new Date(endDate);
    nextPayment.setMonth(nextPayment.getMonth() - 1); // 1 month before expiry
    return nextPayment;
  }
}