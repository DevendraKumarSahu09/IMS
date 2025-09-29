import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { PolicyService, Policy } from '../../../shared/services/policy.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './policy-list.component.html',
  styleUrl: './policy-list.component.css'
})
export class PolicyListComponent implements OnInit, OnDestroy {
  policies: Policy[] = [];
  filteredPolicies: Policy[] = [];
  loading = true;
  error: string | null = null;
  
  // Search and filter properties
  searchQuery = '';
  selectedPriceRange = '';
  sortBy = 'popularity';
  priceRanges = [
    { value: '', label: 'Any Price' },
    { value: '0-1000', label: 'Under ₹1,000/month' },
    { value: '1000-2500', label: '₹1,000 - ₹2,500/month' },
    { value: '2500-5000', label: '₹2,500 - ₹5,000/month' },
    { value: '5000+', label: 'Above ₹5,000/month' }
  ];
  
  sortOptions = [
    { value: 'popularity', label: 'Most Popular' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest First' }
  ];
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private policyService: PolicyService,
    private notificationService: NotificationService
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery = query;
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.loadPolicies();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPolicies(): void {
    this.loading = true;
    this.error = null;
    
    this.policyService.getPolicies().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (policies) => {
        this.policies = policies;
        this.filteredPolicies = [...policies];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading policies:', error);
        this.error = 'Failed to load policies. Please try again.';
        this.loading = false;
        this.notificationService.error('Error', 'Failed to load policies');
      }
    });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }


  onPriceRangeChange(priceRange: string): void {
    this.selectedPriceRange = priceRange;
    this.applyFilters();
  }

  onSortChange(sortBy: string): void {
    this.sortBy = sortBy;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.policies];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(policy => 
        policy.title.toLowerCase().includes(query) ||
        policy.description.toLowerCase().includes(query)
      );
    }

    // Apply category filter (removed since category field doesn't exist in specification)
    // if (this.selectedCategory) {
    //   filtered = filtered.filter(policy => 
    //     policy.category.toLowerCase() === this.selectedCategory.toLowerCase()
    //   );
    // }

    // Apply price range filter
    if (this.selectedPriceRange) {
      filtered = filtered.filter(policy => {
        const premium = policy.premium;
        switch (this.selectedPriceRange) {
          case '0-1000':
            return premium < 1000;
          case '1000-2500':
            return premium >= 1000 && premium <= 2500;
          case '2500-5000':
            return premium > 2500 && premium <= 5000;
          case '5000+':
            return premium > 5000;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered = this.sortPolicies(filtered);

    this.filteredPolicies = filtered;
  }

  private sortPolicies(policies: Policy[]): Policy[] {
    switch (this.sortBy) {
      case 'price-low':
        return policies.sort((a, b) => a.premium - b.premium);
      case 'price-high':
        return policies.sort((a, b) => b.premium - a.premium);
      case 'newest':
        return policies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'popularity':
      default:
        // For now, just return as is. In a real app, you'd have popularity data
        return policies;
    }
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedPriceRange = '';
    this.sortBy = 'popularity';
    this.filteredPolicies = [...this.policies];
  }

  formatCurrency(amount: number): string {
    return this.policyService.formatCurrency(amount);
  }


  getActiveFiltersCount(): number {
    let count = 0;
    if (this.searchQuery.trim()) count++;
    if (this.selectedPriceRange) count++;
    return count;
  }

  getPriceRangeLabel(value: string): string {
    const range = this.priceRanges.find(r => r.value === value);
    return range ? range.label : '';
  }

  getTermDisplay(months: number): string {
    if (months === 12) return '1 Year';
    if (months === 24) return '2 Years';
    if (months === 36) return '3 Years';
    return `${months} Months`;
  }
}
