import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { PolicyService, UserPolicy } from '../../../shared/services/policy.service';
import { ClaimService, ClaimSubmissionRequest } from '../../../shared/services/claim.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-claim-submit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './claim-submit.component.html',
  styleUrl: './claim-submit.component.css'
})
export class ClaimSubmitComponent implements OnInit, OnDestroy {
  claimForm: FormGroup;
  userPolicies: UserPolicy[] = [];
  allUserPolicies: UserPolicy[] = []; // Store all policies for better feedback
  loading = false;
  submitting = false;
  today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private policyService: PolicyService,
    private claimService: ClaimService,
    private notificationService: NotificationService
  ) {
    this.claimForm = this.fb.group({
      userPolicyId: ['', Validators.required],
      incidentDate: ['', Validators.required],
      amountClaimed: ['', [Validators.required, Validators.min(1)]],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadUserPolicies();
    this.setupFormValidation();
  }

  private setupFormValidation(): void {
    // Add custom validator for claim amount
    this.claimForm.get('amountClaimed')?.setValidators([
      Validators.required,
      Validators.min(1),
      this.validateClaimAmount.bind(this)
    ]);
  }

  private validateClaimAmount(control: any) {
    if (!control.value) return null;
    
    const amount = control.value;
    const maxAmount = this.getMaxClaimAmount();
    
    if (maxAmount > 0 && amount > maxAmount) {
      return { 'maxAmountExceeded': true };
    }
    
    return null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Debug method to check form validity
  checkFormValidity(): void {
    console.log('Form valid:', this.claimForm.valid);
    console.log('Form errors:', this.claimForm.errors);
    console.log('Form value:', this.claimForm.value);
    
    Object.keys(this.claimForm.controls).forEach(key => {
      const control = this.claimForm.get(key);
      console.log(`${key}:`, {
        value: control?.value,
        valid: control?.valid,
        errors: control?.errors,
        touched: control?.touched
      });
    });
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
          
          // Filter only ACTIVE policies (simplified logic)
          this.userPolicies = policies.filter(policy => {
            const isActive = policy.status === 'ACTIVE';
            console.log(`Policy ${policy._id} (${policy.policyProduct?.title || policy.policyProductId?.title || 'Unknown'}) - Status: ${policy.status}, IsActive: ${isActive}`);
            return isActive;
          });
          
          console.log('Filtered ACTIVE policies for claims:', this.userPolicies);
        },
        error: (error) => {
          console.error('Error loading user policies:', error);
          this.notificationService.error('Error', 'Failed to load your policies');
        }
      });
  }


  getSelectedPolicy(): UserPolicy | null {
    const userPolicyId = this.claimForm.get('userPolicyId')?.value;
    return this.userPolicies.find(policy => policy._id === userPolicyId) || null;
  }

  getMaxClaimAmount(): number {
    const selectedPolicy = this.getSelectedPolicy();
    if (!selectedPolicy) return 0;
    
    console.log('getMaxClaimAmount - selectedPolicy:', selectedPolicy);
    console.log('getMaxClaimAmount - policyProduct:', selectedPolicy.policyProduct);
    console.log('getMaxClaimAmount - policyProductId:', selectedPolicy.policyProductId);
    
    // Backend returns policyProductId populated as an object with minSumInsured
    let maxAmount = 0;
    if (typeof selectedPolicy.policyProductId === 'object' && selectedPolicy.policyProductId.minSumInsured) {
      maxAmount = selectedPolicy.policyProductId.minSumInsured;
    } else if (selectedPolicy.policyProduct && selectedPolicy.policyProduct.minSumInsured) {
      maxAmount = selectedPolicy.policyProduct.minSumInsured;
    }
    
    console.log('getMaxClaimAmount - result:', maxAmount);
    return maxAmount;
  }

  onSubmit(): void {
    if (this.claimForm.valid) {
      this.submitting = true;
      
      const claimData: ClaimSubmissionRequest = {
        userPolicyId: this.claimForm.value.userPolicyId,
        incidentDate: this.claimForm.value.incidentDate, // Send as YYYY-MM-DD format
        amountClaimed: Number(this.claimForm.value.amountClaimed),
        description: this.claimForm.value.description
      };

      console.log('Submitting claim data:', claimData);
      console.log('UserPolicyId type:', typeof claimData.userPolicyId);
      console.log('UserPolicyId value:', claimData.userPolicyId);
      console.log('UserPolicyId length:', claimData.userPolicyId?.length);
      console.log('Incident date original:', this.claimForm.value.incidentDate);
      console.log('Current date:', new Date().toISOString());
      console.log('Form valid:', this.claimForm.valid);
      console.log('Form errors:', this.claimForm.errors);

      this.claimService.submitClaim(claimData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.submitting = false)
        )
        .subscribe({
          next: (claim) => {
            this.notificationService.success('Success', 'Claim submitted successfully');
            this.router.navigate(['/claims']);
          },
        error: (error) => {
          console.error('Error submitting claim:', error);
          console.error('Error details:', error.error);
          
          let errorMessage = 'Failed to submit claim';
          if (error.error && error.error.details) {
            errorMessage = error.error.details.map((detail: any) => detail.msg).join(', ');
          } else if (error.error && error.error.error) {
            errorMessage = error.error.error;
          }
          
          this.notificationService.error('Error', errorMessage);
        }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.claimForm.controls).forEach(key => {
      const control = this.claimForm.get(key);
      control?.markAsTouched();
    });
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

  getPolicyStartDate(): string {
    const selectedPolicy = this.getSelectedPolicy();
    if (!selectedPolicy) return this.today;
    return new Date(selectedPolicy.startDate).toISOString().split('T')[0];
  }

  getPolicyEndDate(): string {
    const selectedPolicy = this.getSelectedPolicy();
    if (!selectedPolicy) return this.today;
    return new Date(selectedPolicy.endDate).toISOString().split('T')[0];
  }

  getMinIncidentDate(): string {
    const selectedPolicy = this.getSelectedPolicy();
    if (!selectedPolicy) return this.today;
    return new Date(selectedPolicy.startDate).toISOString().split('T')[0];
  }

  getMaxIncidentDate(): string {
    const selectedPolicy = this.getSelectedPolicy();
    if (!selectedPolicy) return this.today;
    return new Date(selectedPolicy.endDate).toISOString().split('T')[0];
  }
}