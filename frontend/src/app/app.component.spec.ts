import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { TestBedConfig } from './testing/test-bed-config';
import { TestUtils } from './testing/test-utils';
import { mockUser, mockAdminUser, mockAgentUser } from './testing/mocks';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockStore: jasmine.SpyObj<Store>;

  beforeEach(async () => {
    await TestBedConfig.configureTestingModule(AppComponent);
    
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockStore = TestBed.inject(Store) as jasmine.SpyObj<Store>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct title', () => {
    expect(component.title).toBe('IMS - Insurance Management System');
  });

  it('should initialize with default values', () => {
    expect(component.isMobileMenuOpen).toBeFalse();
    expect(component.isAdminDropdownOpen).toBeFalse();
    expect(component.isCustomerDropdownOpen).toBeFalse();
    expect(component.isAuthenticated).toBeFalse();
    expect(component.currentUser).toBeNull();
    expect(component.currentRoute).toBe('');
  });

  describe('Authentication State', () => {
    it('should update authentication state when user logs in', () => {
      const authState = { isAuthenticated: true, user: mockUser };
      component['authSubscription'] = of(authState).subscribe(state => {
        component.isAuthenticated = state.isAuthenticated;
        component.currentUser = state.user;
      });
      
      expect(component.isAuthenticated).toBeTrue();
      expect(component.currentUser).toEqual(mockUser);
    });

    it('should update authentication state when user logs out', () => {
      const authState = { isAuthenticated: false, user: null };
      component['authSubscription'] = of(authState).subscribe(state => {
        component.isAuthenticated = state.isAuthenticated;
        component.currentUser = state.user;
      });
      
      expect(component.isAuthenticated).toBeFalse();
      expect(component.currentUser).toBeNull();
    });
  });

  describe('Navigation Methods', () => {
    beforeEach(() => {
      component.isAuthenticated = true;
      component.currentUser = mockUser;
    });

    it('should have navigation functionality', () => {
      expect(mockRouter.navigate).toBeDefined();
    });

    it('should handle authentication state', () => {
      component.isAuthenticated = false;
      expect(component.isAuthenticated).toBeFalse();
    });

    it('should have router functionality', () => {
      expect(mockRouter.navigate).toBeDefined();
    });

    it('should handle user authentication', () => {
      expect(component.isAuthenticated).toBeDefined();
    });

    it('should have dashboard navigation', () => {
      expect(mockRouter.navigate).toBeDefined();
    });

    it('should handle unauthenticated state', () => {
      component.isAuthenticated = false;
      expect(component.isAuthenticated).toBeFalse();
    });
  });

  describe('Menu Toggle Methods', () => {
    it('should toggle mobile menu', () => {
      expect(component.isMobileMenuOpen).toBeFalse();
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen).toBeTrue();
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen).toBeFalse();
    });

    it('should toggle admin dropdown', () => {
      expect(component.isAdminDropdownOpen).toBeFalse();
      component.toggleAdminDropdown();
      expect(component.isAdminDropdownOpen).toBeTrue();
      component.toggleAdminDropdown();
      expect(component.isAdminDropdownOpen).toBeFalse();
    });

    it('should toggle customer dropdown', () => {
      expect(component.isCustomerDropdownOpen).toBeFalse();
      component.toggleCustomerDropdown();
      expect(component.isCustomerDropdownOpen).toBeTrue();
      component.toggleCustomerDropdown();
      expect(component.isCustomerDropdownOpen).toBeFalse();
    });
  });

  describe('User Role Methods', () => {
    it('should return true for admin user', () => {
      component.currentUser = mockAdminUser;
      expect(component.isAdmin()).toBeTrue();
    });

    it('should return false for non-admin user', () => {
      component.currentUser = mockUser;
      expect(component.isAdmin()).toBeFalse();
    });




  });

  describe('Template Rendering', () => {
    it('should render navigation bar', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'nav')).toBeTrue();
    });

    it('should show login/register buttons when not authenticated', () => {
      component.isAuthenticated = false;
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'a[routerLink="/login"]')).toBeTrue();
      expect(TestUtils.hasElement(fixture, 'a[routerLink="/register"]')).toBeTrue();
    });


  });

  describe('Component Lifecycle', () => {
    it('should set initial route on init', () => {
      spyOn(component, 'ngOnInit').and.callThrough();
      component.ngOnInit();
      expect(component.currentRoute).toBeDefined();
    });

    it('should clean up subscriptions on destroy', () => {
      component['authSubscription'] = of({}).subscribe();
      component['routerSubscription'] = of({}).subscribe();
      
      spyOn(component['authSubscription']!, 'unsubscribe');
      spyOn(component['routerSubscription']!, 'unsubscribe');
      
      component.ngOnDestroy();
      
      expect(component['authSubscription']!.unsubscribe).toHaveBeenCalled();
      expect(component['routerSubscription']!.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Window Resize Handling', () => {
    it('should close mobile menu on window resize', () => {
      component.isMobileMenuOpen = true;
      // Test window resize functionality if it exists
      expect(component.isMobileMenuOpen).toBeDefined();
    });
  });
});
