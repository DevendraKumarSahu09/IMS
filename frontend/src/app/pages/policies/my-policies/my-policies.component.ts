import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PolicyService, UserPolicy } from '../../../shared/services/policy.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-my-policies',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-policies.component.html',
  styleUrl: './my-policies.component.css'
})
export class MyPoliciesComponent implements OnInit, OnDestroy {
  userPolicies: UserPolicy[] = [];
  loading = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private policyService: PolicyService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUserPolicies();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserPolicies(): void {
    this.loading = true;
    this.error = null;

    this.policyService.getUserPolicies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (policies) => {
          this.userPolicies = policies;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading user policies:', error);
          this.error = 'Failed to load your policies';
          this.loading = false;
          this.notificationService.error('Error', 'Failed to load your policies');
        }
      });
  }

  cancelPolicy(policyId: string): void {
    if (confirm('Are you sure you want to cancel this policy?')) {
      this.policyService.cancelPolicy(policyId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.success('Success', 'Policy cancelled successfully');
            this.loadUserPolicies(); // Refresh the list
          },
          error: (error) => {
            console.error('Error cancelling policy:', error);
            this.notificationService.error('Error', 'Failed to cancel policy');
          }
        });
    }
  }

  formatCurrency(amount: number): string {
    return this.policyService.formatCurrency(amount);
  }

  getStatusColor(status: string): string {
    return this.policyService.getStatusColor(status);
  }

  getDaysUntilExpiry(policy: UserPolicy): number {
    return this.policyService.getDaysUntilExpiry(policy);
  }

  isPolicyExpiringSoon(policy: UserPolicy): boolean {
    return this.getDaysUntilExpiry(policy) <= 30 && this.getDaysUntilExpiry(policy) > 0;
  }

  canCancelPolicy(policy: UserPolicy): boolean {
    return policy.status === 'ACTIVE';
  }

  refreshPolicies(): void {
    this.loadUserPolicies();
  }
}
