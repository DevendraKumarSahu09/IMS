import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { PolicyService, Policy, PolicyPurchaseRequest } from '../../../shared/services/policy.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-policy-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './policy-detail.component.html',
  styleUrl: './policy-detail.component.css'
})
export class PolicyDetailComponent implements OnInit {
  policy: Policy | null = null;
  loading = true;
  error: string | null = null;
  purchasing = false;
  purchaseError: string | null = null;
  purchaseSuccess = false;

  // Purchase form data
  purchaseForm = {
    startDate: '',
    termMonths: 12,
    nominee: {
      name: '',
      relation: ''
    }
  };

  // Available term options
  termOptions = [
    { value: 6, label: '6 Months' },
    { value: 12, label: '1 Year' },
    { value: 18, label: '18 Months' },
    { value: 24, label: '2 Years' },
    { value: 30, label: '30 Months' },
    { value: 36, label: '3 Years' },
    { value: 48, label: '4 Years' },
    { value: 60, label: '5 Years' },
    { value: 72, label: '6 Years' },
    { value: 84, label: '7 Years' },
    { value: 96, label: '8 Years' },
    { value: 108, label: '9 Years' },
    { value: 120, label: '10 Years' }
  ];

  // Nominee relation options
  relationOptions = [
    { value: 'spouse', label: 'Spouse' },
    { value: 'child', label: 'Child' },
    { value: 'parent', label: 'Parent' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'other', label: 'Other' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private policyService: PolicyService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadPolicy();
  }

  loadPolicy() {
    const policyId = this.route.snapshot.paramMap.get('id');
    if (!policyId) {
      this.error = 'Policy ID not provided';
      this.loading = false;
      return;
    }

    this.policyService.getPolicy(policyId).subscribe({
      next: (policy) => {
        this.policy = policy;
        this.loading = false;
        // Set default term months to policy's default term
        this.purchaseForm.termMonths = policy.termMonths;
      },
      error: (error) => {
        this.error = 'Failed to load policy details';
        this.loading = false;
        console.error('Error loading policy:', error);
      }
    });
  }

  onPurchase() {
    if (!this.policy) return;

    console.log('Purchase button clicked');
    console.log('Policy ID:', this.policy._id);
    console.log('Purchase form data:', this.purchaseForm);

    // Validate form
    if (!this.purchaseForm.startDate) {
      this.purchaseError = 'Please select a start date';
      return;
    }

    if (!this.purchaseForm.nominee.name.trim()) {
      this.purchaseError = 'Please enter nominee name';
      return;
    }

    if (!this.purchaseForm.nominee.relation) {
      this.purchaseError = 'Please select nominee relation';
      return;
    }

    // Check if user is logged in using the original auth service
    const isAuthenticated = this.authService.isAuthenticated();
    const currentUser = this.authService.getCurrentUser();
    
    console.log('Auth check details:', {
      isAuthenticated: isAuthenticated,
      hasUser: !!currentUser,
      user: currentUser
    });
    
    if (!isAuthenticated || !currentUser) {
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    console.log('User is authenticated, proceeding with purchase');

    this.purchasing = true;
    this.purchaseError = null;

    const purchaseData: PolicyPurchaseRequest = {
      startDate: this.purchaseForm.startDate,
      termMonths: this.purchaseForm.termMonths,
      nominee: {
        name: this.purchaseForm.nominee.name.trim(),
        relation: this.purchaseForm.nominee.relation
      }
    };

    console.log('Sending purchase request:', purchaseData);

    this.policyService.purchasePolicy(this.policy._id, purchaseData).subscribe({
      next: (userPolicy) => {
        console.log('Purchase successful:', userPolicy);
        this.purchasing = false;
        this.purchaseSuccess = true;
        // Redirect to user dashboard after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error) => {
        console.error('Purchase failed with error:', error);
        this.purchasing = false;
        this.purchaseError = error.error?.message || 'Failed to purchase policy';
        console.error('Error purchasing policy:', error);
      }
    });
  }

  formatCurrency(amount: number): string {
    return this.policyService.formatCurrency(amount);
  }

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
