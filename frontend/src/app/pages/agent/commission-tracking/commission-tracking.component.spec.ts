import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { AgentCommissionTrackingComponent } from './commission-tracking.component';
import { TestBedConfig } from '../../../testing/test-bed-config';
import { TestUtils } from '../../../testing/test-utils';
import { mockAgentUser } from '../../../testing/mocks';

describe('AgentCommissionTrackingComponent', () => {
  let component: AgentCommissionTrackingComponent;
  let fixture: ComponentFixture<AgentCommissionTrackingComponent>;
  let mockStore: jasmine.SpyObj<Store>;
  let mockHttpService: any;
  let mockNotificationService: any;

  const mockCommission = {
    _id: '1',
    agentId: 'agent1',
    policyId: 'policy1',
    customerId: 'customer1',
    customerName: 'Test Customer',
    policyTitle: 'Test Policy',
    policyCode: 'POL001',
    premiumAmount: 10000,
    commissionRate: 0.05,
    commissionAmount: 500,
    status: 'PAID' as 'PENDING' | 'PAID' | 'CANCELLED',
    paymentDate: '2023-01-01T00:00:00Z',
    createdAt: '2023-01-01T00:00:00Z',
    month: 'January',
    year: 2023
  };

  const mockPolicy = {
    _id: 'policy1',
    premiumPaid: 10000,
    createdAt: '2023-01-01T00:00:00Z',
    userId: { _id: 'customer1', name: 'Test Customer' },
    policyProductId: { title: 'Test Policy', code: 'POL001' }
  };

  beforeEach(async () => {
    await TestBedConfig.configureTestingModule(AgentCommissionTrackingComponent);
    
    fixture = TestBed.createComponent(AgentCommissionTrackingComponent);
    component = fixture.componentInstance;
    mockStore = TestBed.inject(Store) as jasmine.SpyObj<Store>;
    mockHttpService = TestBed.inject('HttpService' as any);
    mockNotificationService = TestBed.inject('NotificationService' as any);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.commissions).toEqual([]);
    expect(component.monthlyData).toEqual([]);
    expect(component.loading).toBeTrue();
    expect(component.error).toBeNull();
    expect(component.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    });
    expect(component.filters).toEqual({
      search: '',
      status: '',
      month: '',
      year: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    expect(component.stats).toEqual({
      totalCommission: 0,
      paidCommission: 0,
      pendingCommission: 0,
      cancelledCommission: 0,
      thisMonthCommission: 0,
      lastMonthCommission: 0,
      totalPolicies: 0,
      averageCommission: 0
    });
    expect(component.selectedCommissions).toEqual([]);
    expect(component.viewingCommission).toBeNull();
    expect(component.showCommissionModal).toBeFalse();
  });

  it('should load data on init', () => {
    spyOn(component, 'loadCommissions');
    spyOn(component, 'loadStats');
    spyOn(component, 'loadMonthlyData');

    component.ngOnInit();

    expect(component.loadCommissions).toHaveBeenCalled();
    expect(component.loadStats).toHaveBeenCalled();
    expect(component.loadMonthlyData).toHaveBeenCalled();
  });

  it('should load commissions successfully', () => {
    const mockResponse = { success: true, data: [mockPolicy] };
    mockHttpService.get.and.returnValue(of(mockResponse));
    spyOn(component, 'generateCommissionData').and.returnValue([mockCommission]);

    component.loadCommissions();

    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
    expect(component.commissions).toEqual([mockCommission]);
  });

  it('should handle commissions loading error', () => {
    mockHttpService.get.and.returnValue(throwError(() => new Error('Network error')));

    component.loadCommissions();

    expect(component.loading).toBeFalse();
    expect(component.error).toBeDefined();
  });

  it('should generate commission data from policies', () => {
    const policies = [mockPolicy];
    const commissions = component.generateCommissionData(policies);

    expect(commissions).toBeDefined();
    expect(Array.isArray(commissions)).toBeTrue();
  });

  it('should get random status with correct distribution', () => {
    const statuses = [];
    for (let i = 0; i < 1000; i++) {
      statuses.push(component.getRandomStatus());
    }

    const pendingCount = statuses.filter(s => s === 'PENDING').length;
    const paidCount = statuses.filter(s => s === 'PAID').length;
    const cancelledCount = statuses.filter(s => s === 'CANCELLED').length;

    // Should be approximately 20% pending, 70% paid, 10% cancelled
    expect(pendingCount).toBeGreaterThan(100);
    expect(pendingCount).toBeLessThan(300);
    expect(paidCount).toBeGreaterThan(600);
    expect(paidCount).toBeLessThan(800);
    expect(cancelledCount).toBeGreaterThan(50);
    expect(cancelledCount).toBeLessThan(150);
  });

  it('should get random payment date', () => {
    const paymentDates = [];
    for (let i = 0; i < 100; i++) {
      paymentDates.push(component.getRandomPaymentDate());
    }

    const validDates = paymentDates.filter(d => d !== undefined);
    expect(validDates.length).toBeGreaterThan(50); // Should be around 70% with dates
  });

  it('should load stats correctly', () => {
    component.commissions = [
      { ...mockCommission, status: 'PAID', commissionAmount: 500 },
      { ...mockCommission, _id: '2', status: 'PENDING', commissionAmount: 300 },
      { ...mockCommission, _id: '3', status: 'CANCELLED', commissionAmount: 200 }
    ];

    component.loadStats();

    expect(component.stats.totalCommission).toBe(1000);
    expect(component.stats.paidCommission).toBe(500);
    expect(component.stats.pendingCommission).toBe(300);
    expect(component.stats.cancelledCommission).toBe(200);
    expect(component.stats.totalPolicies).toBe(3);
    expect(component.stats.averageCommission).toBe(1000 / 3);
  });

  it('should load monthly data correctly', () => {
    component.commissions = [
      { ...mockCommission, month: 'January', year: 2023, commissionAmount: 500 },
      { ...mockCommission, _id: '2', month: 'February', year: 2023, commissionAmount: 300 }
    ];

    component.loadMonthlyData();

    expect(component.monthlyData.length).toBe(12);
    expect(component.monthlyData[0].month).toBeDefined();
    expect(component.monthlyData[0].year).toBeDefined();
    expect(component.monthlyData[0].totalCommission).toBeDefined();
    expect(component.monthlyData[0].paidCommission).toBeDefined();
    expect(component.monthlyData[0].pendingCommission).toBeDefined();
    expect(component.monthlyData[0].policyCount).toBeDefined();
  });

  it('should get month name correctly', () => {
    expect(component.getMonthName(1)).toBe('January');
    expect(component.getMonthName(6)).toBe('June');
    expect(component.getMonthName(12)).toBe('December');
  });

  it('should apply filters and reset to page 1', () => {
    spyOn(component, 'loadCommissions');
    component.pagination.page = 3;

    component.applyFilters();

    expect(component.pagination.page).toBe(1);
    expect(component.loadCommissions).toHaveBeenCalled();
  });

  it('should clear filters', () => {
    component.filters = {
      search: 'test',
      status: 'PAID',
      month: 'January',
      year: '2023',
      dateFrom: '2023-01-01',
      dateTo: '2023-01-31',
      sortBy: 'commissionAmount',
      sortOrder: 'asc'
    };
    spyOn(component, 'applyFilters');

    component.clearFilters();

    expect(component.filters).toEqual({
      search: '',
      status: '',
      month: '',
      year: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    expect(component.applyFilters).toHaveBeenCalled();
  });

  it('should change page', () => {
    spyOn(component, 'loadCommissions');

    component.onPageChange(3);

    expect(component.pagination.page).toBe(3);
    expect(component.loadCommissions).toHaveBeenCalled();
  });

  it('should change limit and reset to page 1', () => {
    spyOn(component, 'loadCommissions');

    component.onLimitChange(20);

    expect(component.pagination.limit).toBe(20);
    expect(component.pagination.page).toBe(1);
    expect(component.loadCommissions).toHaveBeenCalled();
  });

  it('should select and deselect commission', () => {
    component.selectCommission('commission1');
    expect(component.selectedCommissions).toContain('commission1');

    component.selectCommission('commission1');
    expect(component.selectedCommissions).not.toContain('commission1');
  });

  it('should select all commissions', () => {
    component.commissions = [mockCommission, { ...mockCommission, _id: '2' }];
    component.selectAllCommissions();
    expect(component.selectedCommissions).toEqual(['1', '2']);

    component.selectAllCommissions();
    expect(component.selectedCommissions).toEqual([]);
  });

  it('should view commission', () => {
    component.viewCommission(mockCommission);

    expect(component.viewingCommission).toBe(mockCommission);
    expect(component.showCommissionModal).toBeTrue();
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(1000)).toBe('₹1.0K');
    expect(component.formatCurrency(100000)).toBe('₹1.0L');
    expect(component.formatCurrency(500)).toBe('₹500');
  });

  it('should format date correctly', () => {
    const dateString = '2023-01-01T00:00:00Z';
    const formattedDate = component.formatDate(dateString);
    
    expect(formattedDate).toMatch(/\d{1,2}\s\w{3}\s\d{4}/);
  });

  it('should return correct status color', () => {
    expect(component.getStatusColor('paid')).toBe('badge-success');
    expect(component.getStatusColor('pending')).toBe('badge-warning');
    expect(component.getStatusColor('cancelled')).toBe('badge-error');
    expect(component.getStatusColor('unknown')).toBe('badge-neutral');
  });

  it('should return correct status text', () => {
    expect(component.getStatusText('paid')).toBe('Paid');
    expect(component.getStatusText('pending')).toBe('Pending');
    expect(component.getStatusText('cancelled')).toBe('Cancelled');
    expect(component.getStatusText('unknown')).toBe('unknown');
  });

  it('should count active filters correctly', () => {
    component.filters = {
      search: 'test',
      status: 'PAID',
      month: 'January',
      year: '2023',
      dateFrom: '2023-01-01',
      dateTo: '2023-01-31',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    expect(component.getActiveFiltersCount()).toBe(6);
  });

  it('should return correct sort icon', () => {
    component.filters.sortBy = 'commissionAmount';
    component.filters.sortOrder = 'asc';

    expect(component.getSortIcon('commissionAmount')).toBe('↑');
    expect(component.getSortIcon('createdAt')).toBe('↕️');
  });

  it('should sort by field', () => {
    spyOn(component, 'applyFilters');

    component.sortBy('commissionAmount');

    expect(component.filters.sortBy).toBe('commissionAmount');
    expect(component.filters.sortOrder).toBe('asc');
    expect(component.applyFilters).toHaveBeenCalled();

    component.sortBy('commissionAmount');

    expect(component.filters.sortOrder).toBe('desc');
  });

  it('should calculate commission percentage', () => {
    component.stats = {
      totalCommission: 1000,
      thisMonthCommission: 200,
      paidCommission: 0,
      pendingCommission: 0,
      cancelledCommission: 0,
      lastMonthCommission: 0,
      totalPolicies: 0,
      averageCommission: 0
    };

    expect(component.getCommissionPercentage()).toBe(20);
  });

  it('should return 0 commission percentage when total is 0', () => {
    component.stats.totalCommission = 0;

    expect(component.getCommissionPercentage()).toBe(0);
  });

  it('should calculate growth percentage', () => {
    component.stats = {
      thisMonthCommission: 300,
      lastMonthCommission: 200,
      totalCommission: 0,
      paidCommission: 0,
      pendingCommission: 0,
      cancelledCommission: 0,
      totalPolicies: 0,
      averageCommission: 0
    };

    expect(component.getGrowthPercentage()).toBe(50);
  });

  it('should return 0 growth percentage when last month is 0', () => {
    component.stats.lastMonthCommission = 0;

    expect(component.getGrowthPercentage()).toBe(0);
  });

  it('should calculate chart bar height', () => {
    component.monthlyData = [
      { month: 'January', year: 2023, totalCommission: 1000, paidCommission: 800, pendingCommission: 200, policyCount: 5 },
      { month: 'February', year: 2023, totalCommission: 500, paidCommission: 400, pendingCommission: 100, policyCount: 3 }
    ];

    expect(component.getChartBarHeight(1000)).toBe(200);
    expect(component.getChartBarHeight(500)).toBe(100);
  });

  it('should return 0 chart bar height when no data', () => {
    component.monthlyData = [];

    expect(component.getChartBarHeight(1000)).toBe(0);
  });

  it('should clean up on destroy', () => {
    component.ngOnDestroy();

    // Should complete without errors
    expect(component).toBeTruthy();
  });
});
