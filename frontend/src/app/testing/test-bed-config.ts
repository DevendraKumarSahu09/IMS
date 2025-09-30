import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Apollo } from 'apollo-angular';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { PolicyService } from '../shared/services/policy.service';
import { ClaimService } from '../shared/services/claim.service';
import { PaymentService } from '../shared/services/payment.service';
import { 
  MockAuthService, 
  MockHttpService, 
  MockNotificationService, 
  MockRouter, 
  MockActivatedRoute,
  MockStore, 
  MockApollo,
  MockHttpClient,
  MockPolicyService,
  MockClaimService,
  MockPaymentService,
  mockUser 
} from './mocks';

/**
 * Common TestBed configuration for component testing
 */
export class TestBedConfig {
  /**
   * Configure TestBed with common providers and imports
   */
  static configureTestingModule(component: any, additionalConfig: any = {}) {
    return TestBed.configureTestingModule({
      imports: [component, ...(additionalConfig.imports || [])],
      providers: [
        { provide: Router, useClass: MockRouter },
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: Store, useClass: MockStore },
        { provide: Apollo, useClass: MockApollo },
        { provide: HttpClient, useClass: MockHttpClient },
        { provide: 'AuthService', useClass: MockAuthService },
        { provide: 'HttpService', useClass: MockHttpService },
        { provide: 'NotificationService', useClass: MockNotificationService },
        { provide: 'PolicyService', useClass: MockPolicyService },
        { provide: 'ClaimService', useClass: MockClaimService },
        { provide: 'PaymentService', useClass: MockPaymentService },
        { provide: PolicyService, useClass: MockPolicyService },
        { provide: ClaimService, useClass: MockClaimService },
        { provide: PaymentService, useClass: MockPaymentService },
        ...(additionalConfig.providers || [])
      ],
      ...additionalConfig
    });
  }

  /**
   * Create component with common setup
   */
  static createComponent<T>(component: any): ComponentFixture<T> {
    const fixture = TestBed.createComponent<T>(component);
    fixture.detectChanges();
    return fixture;
  }

  /**
   * Setup component with authentication state
   */
  static setupWithAuth<T>(
    component: any, 
    isAuthenticated: boolean = true, 
    user: any = mockUser
  ): ComponentFixture<T> {
    const fixture = TestBed.createComponent<T>(component);
    
    // Mock auth state
    const authService = TestBed.inject('AuthService' as any) as MockAuthService;
    authService.authState$ = of({ isAuthenticated, user: isAuthenticated ? user : null });
    
    fixture.detectChanges();
    return fixture;
  }

  /**
   * Setup component with loading state
   */
  static setupWithLoading<T>(component: any, loading: boolean = true): ComponentFixture<T> {
    const fixture = TestBed.createComponent<T>(component);
    
    // Set loading state on component
    if (loading && 'loading' in (fixture.componentInstance as any)) {
      (fixture.componentInstance as any).loading = true;
    }
    
    fixture.detectChanges();
    return fixture;
  }

  /**
   * Setup component with error state
   */
  static setupWithError<T>(component: any, error: string = 'Test error'): ComponentFixture<T> {
    const fixture = TestBed.createComponent<T>(component);
    
    // Set error state on component
    if ('error' in (fixture.componentInstance as any)) {
      (fixture.componentInstance as any).error = error;
    }
    
    fixture.detectChanges();
    return fixture;
  }

  /**
   * Setup component with mock data
   */
  static setupWithData<T>(component: any, data: any): ComponentFixture<T> {
    const fixture = TestBed.createComponent<T>(component);
    
    // Set data on component
    Object.assign(fixture.componentInstance as any, data);
    
    fixture.detectChanges();
    return fixture;
  }

  /**
   * Setup component with NgRx store state
   */
  static setupWithStore<T>(component: any, storeState: any): ComponentFixture<T> {
    const fixture = TestBed.createComponent<T>(component);
    
    // Mock store state
    const store = TestBed.inject(Store) as any;
    store.select.and.returnValue(of(storeState));
    
    fixture.detectChanges();
    return fixture;
  }

  /**
   * Setup component with router navigation
   */
  static setupWithRouter<T>(component: any, routerConfig: any = {}): ComponentFixture<T> {
    const fixture = TestBed.createComponent<T>(component);
    
    // Mock router
    const router = TestBed.inject(Router) as any;
    Object.assign(router, routerConfig);
    
    fixture.detectChanges();
    return fixture;
  }

  /**
   * Setup component with Apollo GraphQL
   */
  static setupWithApollo<T>(component: any, apolloConfig: any = {}): ComponentFixture<T> {
    const fixture = TestBed.createComponent<T>(component);
    
    // Mock Apollo
    const apollo = TestBed.inject(Apollo) as any;
    Object.assign(apollo, apolloConfig);
    
    fixture.detectChanges();
    return fixture;
  }

  /**
   * Setup component with all mocks
   */
  static setupWithAllMocks<T>(
    component: any, 
    config: {
      auth?: { isAuthenticated: boolean; user?: any };
      loading?: boolean;
      error?: string;
      data?: any;
      store?: any;
      router?: any;
      apollo?: any;
    } = {}
  ): ComponentFixture<T> {
    const fixture = TestBed.createComponent<T>(component);
    
    // Apply all configurations
    if (config.auth) {
      const authService = TestBed.inject('AuthService' as any) as MockAuthService;
      authService.authState$ = of({
        isAuthenticated: config.auth.isAuthenticated,
        user: config.auth.user || mockUser
      });
    }
    
    if (config.loading && 'loading' in (fixture.componentInstance as any)) {
      (fixture.componentInstance as any).loading = config.loading;
    }
    
    if (config.error && 'error' in (fixture.componentInstance as any)) {
      (fixture.componentInstance as any).error = config.error;
    }
    
    if (config.data) {
      Object.assign(fixture.componentInstance as any, config.data);
    }
    
    if (config.store) {
      const store = TestBed.inject(Store) as any;
      store.select.and.returnValue(of(config.store));
    }
    
    if (config.router) {
      const router = TestBed.inject(Router) as any;
      Object.assign(router, config.router);
    }
    
    if (config.apollo) {
      const apollo = TestBed.inject(Apollo) as any;
      Object.assign(apollo, config.apollo);
    }
    
    fixture.detectChanges();
    return fixture;
  }
}
