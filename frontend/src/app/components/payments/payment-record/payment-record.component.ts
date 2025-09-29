import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { PolicyService, UserPolicy } from '../../../shared/services/policy.service';
import { PaymentService, PaymentRequest, PaymentMethodOption } from '../../../shared/services/payment.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-payment-record',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-record.component.html',
  styleUrl: './payment-record.component.css'
})
export class PaymentRecordComponent implements OnInit, OnDestroy {
  paymentForm: FormGroup;
  userPolicies: UserPolicy[] = [];
  allUserPolicies: UserPolicy[] = []; // Store all policies for better feedback
  paymentMethods: PaymentMethodOption[] = [];
  selectedPaymentMethod: PaymentMethodOption | null = null;
  loading = false;
  submitting = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private policyService: PolicyService,
    private paymentService: PaymentService,
    private notificationService: NotificationService
  ) {
    this.paymentForm = this.fb.group({
      userPolicyId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      paymentMethod: ['', Validators.required],
      paymentDetails: this.fb.group({
        cardNumber: [''],
        expiryDate: [''],
        cvv: [''],
        cardholderName: [''],
        upiId: [''],
        bankName: [''],
        accountNumber: ['']
      })
    });
  }

  ngOnInit(): void {
    this.loadUserPolicies();
    this.loadPaymentMethods();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserPolicies(): void {
    this.loading = true;
    this.policyService.getUserPolicies()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (policies) => {
          console.log('All user policies loaded:', policies);
          console.log('Policy IDs:', policies.map(p => ({ 
            id: p._id, 
            idType: typeof p._id,
            idLength: p._id?.length,
            status: p.status, 
            startDate: p.startDate, 
            endDate: p.endDate,
            title: p.policyProduct?.title || p.policyProductId?.title || 'Unknown'
          })));
          
          // Store all policies for better feedback
          this.allUserPolicies = policies;
          
          // Filter only ACTIVE policies for payment recording
          this.userPolicies = policies.filter(policy => {
            const isActive = policy.status === 'ACTIVE';
            console.log(`Policy ${policy._id} (${policy.policyProduct?.title || policy.policyProductId?.title || 'Unknown'}) - Status: ${policy.status}, IsActive: ${isActive}`);
            return isActive;
          });
          
          console.log('Filtered ACTIVE policies for payments:', this.userPolicies);
        },
        error: (error) => {
          console.error('Error loading user policies:', error);
          this.notificationService.error('Error', 'Failed to load your policies');
        }
      });
  }

  loadPaymentMethods(): void {
    this.paymentMethods = this.paymentService.getPaymentMethods();
  }

  onPaymentMethodChange(methodId: string): void {
    this.selectedPaymentMethod = this.paymentMethods.find(method => method.id === methodId) || null;
    
    // Clear payment details when method changes
    const paymentDetails = this.paymentForm.get('paymentDetails') as FormGroup;
    Object.keys(paymentDetails.controls).forEach(key => {
      paymentDetails.get(key)?.setValue('');
    });

    // Set validators based on selected payment method
    this.updatePaymentDetailsValidators();
  }

  private updatePaymentDetailsValidators(): void {
    const paymentDetails = this.paymentForm.get('paymentDetails') as FormGroup;
    
    // Payment details are optional for backend - only for UI display
    // Clear all validators since backend doesn't require these fields
    Object.keys(paymentDetails.controls).forEach(key => {
      paymentDetails.get(key)?.clearValidators();
      paymentDetails.get(key)?.updateValueAndValidity();
    });
  }


  onSubmit(): void {
    if (this.paymentForm.valid) {
      this.submitting = true;
      
      // Map payment method to backend format
      const methodMapping: { [key: string]: 'CARD' | 'NETBANKING' | 'OFFLINE' | 'SIMULATED' } = {
        'card': 'CARD',
        'upi': 'SIMULATED',
        'netbanking': 'NETBANKING',
        'wallet': 'SIMULATED'
      };

      const paymentData: PaymentRequest = {
        userPolicyId: this.paymentForm.value.userPolicyId,
        amount: this.paymentForm.value.amount,
        method: methodMapping[this.paymentForm.value.paymentMethod] || 'SIMULATED',
        reference: this.paymentService.generatePaymentReference(),
        paymentMethod: this.paymentForm.value.paymentMethod,
        paymentDetails: this.paymentForm.value.paymentDetails
      };

      this.paymentService.createPayment(paymentData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.submitting = false)
        )
        .subscribe({
          next: (payment: any) => {
            console.log('Payment recorded successfully:', payment);
            this.notificationService.success('Success', 'Payment recorded successfully!');
            this.router.navigate(['/payments']);
          },
          error: (error: any) => {
            console.error('Error recording payment:', error);
            
            let errorMessage = 'Failed to record payment';
            if (error.error && error.error.details) {
              errorMessage = error.error.details.map((detail: any) => detail.msg).join(', ');
            } else if (error.error && error.error.error) {
              errorMessage = error.error.error;
            } else if (error.error && error.error.message) {
              errorMessage = error.error.message;
            }
            
            this.notificationService.error('Error', errorMessage);
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      const control = this.paymentForm.get(key);
      control?.markAsTouched();
    });
  }

  getSelectedPolicy(): UserPolicy | null {
    const policyId = this.paymentForm.get('userPolicyId')?.value;
    return this.userPolicies.find(policy => policy._id === policyId) || null;
  }

  getSuggestedAmount(): number {
    const selectedPolicy = this.getSelectedPolicy();
    return selectedPolicy ? this.getPolicyPremium(selectedPolicy) : 0;
  }

  usePremiumAmount(): void {
    const selectedPolicy = this.getSelectedPolicy();
    if (selectedPolicy) {
      this.paymentForm.patchValue({
        amount: this.getPolicyPremium(selectedPolicy)
      });
    }
  }

  formatCurrency(amount: number): string {
    return this.policyService.formatCurrency(amount);
  }

  getPolicyDisplayName(policy: UserPolicy): string {
    console.log('getPolicyDisplayName - policy:', policy);
    console.log('getPolicyDisplayName - policyProduct:', policy.policyProduct);
    console.log('getPolicyDisplayName - policyProductId:', policy.policyProductId);
    
    // Backend returns policyProductId populated as an object with title
    if (typeof policy.policyProductId === 'object' && policy.policyProductId.title) {
      return policy.policyProductId.title;
    }
    
    // Fallback for policyProduct (if populated differently)
    if (policy.policyProduct && policy.policyProduct.title) {
      return policy.policyProduct.title;
    }
    
    return 'Insurance Policy';
  }

  getPolicyCoverage(policy: UserPolicy): number {
    // Backend returns policyProductId populated as an object with minSumInsured
    if (typeof policy.policyProductId === 'object' && policy.policyProductId.minSumInsured) {
      return policy.policyProductId.minSumInsured;
    }
    
    // Fallback for policyProduct (if populated differently)
    if (policy.policyProduct && policy.policyProduct.minSumInsured) {
      return policy.policyProduct.minSumInsured;
    }
    
    return 0;
  }

  getPolicyPremium(policy: UserPolicy): number {
    return policy.premiumPaid;
  }

  getNextPaymentDate(policy: UserPolicy): Date | null {
    return this.paymentService.calculateNextPaymentDate(policy);
  }

  getFieldError(fieldName: string): string | null {
    const field = this.paymentForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors?.['min']) {
        return `${this.getFieldLabel(fieldName)} must be greater than 0`;
      }
      if (field.errors?.['pattern']) {
        return `Invalid ${this.getFieldLabel(fieldName).toLowerCase()} format`;
      }
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'userPolicyId': 'Policy',
      'amount': 'Amount',
      'paymentMethod': 'Payment Method',
      'cardNumber': 'Card Number',
      'expiryDate': 'Expiry Date',
      'cvv': 'CVV',
      'cardholderName': 'Cardholder Name',
      'upiId': 'UPI ID',
      'bankName': 'Bank Name',
      'accountNumber': 'Account Number'
    };
    return labels[fieldName] || fieldName;
  }
}