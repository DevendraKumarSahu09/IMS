import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../store';
import { selectUser } from '../../../store/auth/auth.selectors';
import { HttpService } from '../../../services/http.service';
import { NotificationService } from '../../../shared/services/notification.service';

interface Policy {
  _id: string;
  code: string;
  title: string;
  description: string;
  premium: number;
  termMonths: number;
  minSumInsured: number;
  createdAt: string;
  status?: string;
}

interface CreatePolicyRequest {
  code: string;
  title: string;
  description: string;
  premium: number;
  termMonths: number;
  minSumInsured: number;
}

@Component({
  selector: 'app-policy-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './policy-management.component.html',
  styleUrl: './policy-management.component.css'
})
export class PolicyManagementComponent implements OnInit {
  user$: Observable<any>;
  policies: Policy[] = [];
  loading = true;
  error: string | null = null;
  showCreateForm = false;
  editingPolicy: Policy | null = null;
  newPolicy: CreatePolicyRequest = {
    code: '',
    title: '',
    description: '',
    premium: 0,
    termMonths: 12,
    minSumInsured: 0
  };

  constructor(
    private store: Store<AppState>,
    private httpService: HttpService,
    private notificationService: NotificationService
  ) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.loading = true;
    this.error = null;

    this.httpService.get('/policies').subscribe({
      next: (response: any) => {
        // Handle both direct array response and wrapped response
        if (response.success && response.data) {
          this.policies = response.data;
        } else if (Array.isArray(response)) {
          this.policies = response;
        } else {
          this.policies = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading policies:', error);
        this.error = 'Failed to load policies';
        this.loading = false;
        
        this.notificationService.error(
          'Loading Failed',
          'Failed to load policies. Please refresh the page.'
        );
      }
    });
  }

  createPolicy(): void {
    if (!this.newPolicy.code || !this.newPolicy.title || !this.newPolicy.premium) {
      this.notificationService.warning(
        'Validation Error',
        'Please fill in all required fields (Code, Title, and Premium)'
      );
      return;
    }

    this.httpService.post('/policies', this.newPolicy).subscribe({
      next: (response: any) => {
        this.loadPolicies();
        this.showCreateForm = false;
        this.resetForm();
        this.notificationService.success(
          'Policy Created',
          `Policy "${this.newPolicy.title}" has been created successfully`
        );
      },
      error: (error) => {
        console.error('Error creating policy:', error);
        
        // Handle specific error cases
        let errorMessage = 'Failed to create policy';
        if (error.error && error.error.error) {
          if (error.error.error.includes('Policy code already exists')) {
            errorMessage = 'A policy with this code already exists. Please use a different code.';
          } else {
            errorMessage = error.error.error;
          }
        } else if (error.status === 400) {
          errorMessage = 'Invalid policy data. Please check your inputs.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to create policies.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        this.notificationService.error(
          'Policy Creation Failed',
          errorMessage
        );
      }
    });
  }

  editPolicy(policy: Policy): void {
    this.editingPolicy = { ...policy };
    this.showCreateForm = true;
    this.newPolicy = {
      code: policy.code,
      title: policy.title,
      description: policy.description,
      premium: policy.premium,
      termMonths: policy.termMonths,
      minSumInsured: policy.minSumInsured
    };
  }

  updatePolicy(): void {
    if (!this.editingPolicy) return;

    this.httpService.put(`/policies/${this.editingPolicy._id}`, this.newPolicy).subscribe({
      next: (response: any) => {
        this.loadPolicies();
        this.cancelEdit();
        this.notificationService.success(
          'Policy Updated',
          `Policy "${this.newPolicy.title}" has been updated successfully`
        );
      },
      error: (error) => {
        console.error('Error updating policy:', error);
        
        let errorMessage = 'Failed to update policy';
        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.status === 400) {
          errorMessage = 'Invalid policy data. Please check your inputs.';
        } else if (error.status === 404) {
          errorMessage = 'Policy not found.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        this.notificationService.error(
          'Policy Update Failed',
          errorMessage
        );
      }
    });
  }

  deletePolicy(policyId: string): void {
    if (confirm('Are you sure you want to delete this policy?')) {
      this.httpService.delete(`/policies/${policyId}`).subscribe({
        next: () => {
          this.loadPolicies();
          this.notificationService.success(
            'Policy Deleted',
            'Policy has been deleted successfully'
          );
        },
        error: (error) => {
          console.error('Error deleting policy:', error);
          
          let errorMessage = 'Failed to delete policy';
          if (error.error && error.error.error) {
            errorMessage = error.error.error;
          } else if (error.status === 404) {
            errorMessage = 'Policy not found.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          
          this.notificationService.error(
            'Policy Deletion Failed',
            errorMessage
          );
        }
      });
    }
  }

  cancelEdit(): void {
    this.editingPolicy = null;
    this.showCreateForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.newPolicy = {
      code: '',
      title: '',
      description: '',
      premium: 0,
      termMonths: 12,
      minSumInsured: 0
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getTermDisplay(months: number): string {
    if (months === 12) return '1 Year';
    if (months === 24) return '2 Years';
    if (months === 36) return '3 Years';
    return `${months} Months`;
  }

}
