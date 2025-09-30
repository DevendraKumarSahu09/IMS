import { of, throwError } from 'rxjs';
import { User } from '../store/auth/auth.state';

/**
 * Mock data for testing
 */
export const mockUser: User = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'customer'
};

export const mockAdminUser: User = {
  id: '2',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin'
};

export const mockAgentUser: User = {
  id: '3',
  name: 'Agent User',
  email: 'agent@example.com',
  role: 'agent'
};

export const mockPolicy = {
  _id: '1',
  code: 'POL001',
  title: 'Test Policy',
  description: 'Test Policy Description',
  premium: 1000,
  termMonths: 12,
  minSumInsured: 50000,
  createdAt: new Date()
};

export const mockUserPolicy = {
  _id: '1',
  userId: '1',
  policyProductId: '1',
  startDate: new Date(),
  endDate: new Date(),
  premiumPaid: 1000,
  status: 'ACTIVE' as 'ACTIVE' | 'CANCELLED' | 'EXPIRED',
  assignedAgentId: '3',
  nominee: { name: 'Test Nominee', relation: 'spouse' },
  createdAt: new Date()
};

export const mockClaim = {
  _id: '1',
  userId: '1',
  userPolicyId: '1',
  incidentDate: new Date(),
  description: 'Test Claim',
  amountClaimed: 5000,
  status: 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED',
  decisionNotes: '',
  assignedAgentId: '3',
  decidedByAgentId: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

export const mockPayment = {
  _id: '1',
  userId: '1',
  userPolicyId: '1',
  amount: 1000,
  method: 'CARD' as 'CARD' | 'NETBANKING' | 'OFFLINE' | 'SIMULATED',
  reference: 'PAY001',
  paymentMethod: 'CARD' as 'CARD' | 'NETBANKING' | 'OFFLINE' | 'SIMULATED',
  paymentStatus: 'SUCCESS' as 'PENDING' | 'FAILED' | 'SUCCESS',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Mock services
 */
export class MockAuthService {
  authState$ = of({ isAuthenticated: true, user: mockUser });
  login = jasmine.createSpy('login').and.returnValue(of({ token: 'mock-token', user: mockUser }));
  register = jasmine.createSpy('register').and.returnValue(of({ token: 'mock-token', user: mockUser }));
  logout = jasmine.createSpy('logout');
  getCurrentUser = jasmine.createSpy('getCurrentUser').and.returnValue(of(mockUser));
}

export class MockHttpService {
  get = jasmine.createSpy('get').and.returnValue(of({ success: true, data: [mockUserPolicy] }));
  post = jasmine.createSpy('post').and.returnValue(of({ success: true }));
  put = jasmine.createSpy('put').and.returnValue(of({ success: true }));
  delete = jasmine.createSpy('delete').and.returnValue(of({ success: true }));
}

export class MockNotificationService {
  showSuccess = jasmine.createSpy('showSuccess');
  showError = jasmine.createSpy('showError');
  showInfo = jasmine.createSpy('showInfo');
  showWarning = jasmine.createSpy('showWarning');
}

export class MockRouter {
  navigate = jasmine.createSpy('navigate');
  navigateByUrl = jasmine.createSpy('navigateByUrl');
  createUrlTree = jasmine.createSpy('createUrlTree').and.returnValue({});
  serializeUrl = jasmine.createSpy('serializeUrl').and.returnValue('/test');
  url = '/test';
  events = of({});
  routerState = {
    snapshot: {
      url: '/test',
      root: {}
    }
  };
}

export class MockActivatedRoute {
  params = of({});
  queryParams = of({});
  snapshot = {
    params: {},
    queryParams: {},
    url: []
  };
}

export class MockStore {
  select = jasmine.createSpy('select').and.returnValue(of({}));
  dispatch = jasmine.createSpy('dispatch');
  pipe = jasmine.createSpy('pipe').and.returnValue(of({}));
}

export class MockApollo {
  query = jasmine.createSpy('query').and.returnValue(of({ data: {} }));
  mutate = jasmine.createSpy('mutate').and.returnValue(of({ data: {} }));
  watchQuery = jasmine.createSpy('watchQuery').and.returnValue({
    valueChanges: of({ data: {} })
  });
}

export class MockHttpClient {
  get = jasmine.createSpy('get').and.returnValue(of({}));
  post = jasmine.createSpy('post').and.returnValue(of({}));
  put = jasmine.createSpy('put').and.returnValue(of({}));
  delete = jasmine.createSpy('delete').and.returnValue(of({}));
  patch = jasmine.createSpy('patch').and.returnValue(of({}));
}

export class MockPolicyService {
  getUserPolicies = jasmine.createSpy('getUserPolicies').and.returnValue(of([mockUserPolicy]));
  getPolicies = jasmine.createSpy('getPolicies').and.returnValue(of([mockPolicy]));
  formatCurrency = jasmine.createSpy('formatCurrency').and.returnValue('$1,000.00');
  getStatusColor = jasmine.createSpy('getStatusColor').and.returnValue('green');
  getStatusText = jasmine.createSpy('getStatusText').and.returnValue('Active');
  getDaysUntilExpiry = jasmine.createSpy('getDaysUntilExpiry').and.returnValue(30);
}

export class MockClaimService {
  submitClaim = jasmine.createSpy('submitClaim').and.returnValue(of(mockClaim));
  getClaims = jasmine.createSpy('getClaims').and.returnValue(of([mockClaim]));
  createClaim = jasmine.createSpy('createClaim').and.returnValue(of(mockClaim));
  getStatusColor = jasmine.createSpy('getStatusColor').and.returnValue('badge-warning');
  calculateClaimStats = jasmine.createSpy('calculateClaimStats').and.returnValue({
    totalClaims: 10,
    pendingClaims: 3,
    approvedClaims: 5,
    rejectedClaims: 2,
    totalAmount: 50000
  });
}

export class MockPaymentService {
  recordPayment = jasmine.createSpy('recordPayment').and.returnValue(of(mockPayment));
  getPayments = jasmine.createSpy('getPayments').and.returnValue(of([mockPayment]));
  createPayment = jasmine.createSpy('createPayment').and.returnValue(of(mockPayment));
  getUserPayments = jasmine.createSpy('getUserPayments').and.returnValue(of([mockPayment]));
  formatCurrency = jasmine.createSpy('formatCurrency').and.returnValue('$1,000.00');
  getPaymentMethods = jasmine.createSpy('getPaymentMethods').and.returnValue([
    { id: 'card', name: 'Credit/Debit Card', description: 'Pay with your credit or debit card', icon: 'card-icon' },
    { id: 'upi', name: 'UPI', description: 'Pay using UPI ID or QR code', icon: 'upi-icon' }
  ]);
  calculatePaymentStats = jasmine.createSpy('calculatePaymentStats').and.returnValue({
    totalPayments: 1,
    totalAmount: 1000,
    averageAmount: 1000,
    successRate: 100
  });
  generatePaymentReference = jasmine.createSpy('generatePaymentReference').and.returnValue('PAY001');
}

/**
 * Mock GraphQL responses
 */
export const mockLoginResponse = {
  data: {
    login: {
      token: 'mock-jwt-token',
      user: mockUser
    }
  }
};

export const mockRegisterResponse = {
  data: {
    register: {
      token: 'mock-jwt-token',
      user: mockUser
    }
  }
};

export const mockCurrentUserResponse = {
  data: {
    me: mockUser
  }
};

/**
 * Mock error responses
 */
export const mockErrorResponse = {
  error: {
    message: 'Test error message',
    graphQLErrors: [],
    networkError: null
  }
};

/**
 * Mock API responses
 */
export const mockPoliciesResponse = {
  success: true,
  data: [mockPolicy]
};

export const mockClaimsResponse = {
  success: true,
  data: [mockClaim],
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    pages: 1
  }
};

export const mockPaymentsResponse = {
  success: true,
  data: [mockPayment]
};

/**
 * Mock component inputs
 */
export const mockComponentInputs = {
  user: mockUser,
  policy: mockPolicy,
  claim: mockClaim,
  payment: mockPayment,
  loading: false,
  error: null
};

/**
 * Helper function to create mock observables
 */
export function createMockObservable<T>(data: T) {
  return of(data);
}

export function createMockErrorObservable(error: any) {
  return throwError(() => error);
}

/**
 * Helper function to create mock promises
 */
export function createMockPromise<T>(data: T): Promise<T> {
  return Promise.resolve(data);
}

export function createMockErrorPromise(error: any): Promise<never> {
  return Promise.reject(error);
}
