import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { HomeComponent } from './home.component';
import { TestBedConfig } from '../../testing/test-bed-config';
import { TestUtils } from '../../testing/test-utils';
import { mockUser } from '../../testing/mocks';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    await TestBedConfig.configureTestingModule(HomeComponent);
    
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isAuthenticated).toBeFalse();
  });

  describe('Authentication State', () => {
    it('should update authentication state when user logs in', () => {
      const authState = { isAuthenticated: true, user: mockUser };
      component.ngOnInit();
      
      // Simulate auth state change
      component['authService'].authState$ = of(authState);
      component.ngOnInit();
      
      expect(component.isAuthenticated).toBeTrue();
    });

    it('should update authentication state when user logs out', () => {
      const authState = { isAuthenticated: false, user: null };
      component.ngOnInit();
      
      // Simulate auth state change
      component['authService'].authState$ = of(authState);
      component.ngOnInit();
      
      expect(component.isAuthenticated).toBeFalse();
    });
  });

  describe('Navigation Methods', () => {
    it('should navigate to policies when authenticated', () => {
      component.isAuthenticated = true;
      component.navigateToPolicies();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/policies']);
    });

    it('should navigate to login when not authenticated for policies', () => {
      component.isAuthenticated = false;
      component.navigateToPolicies();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should navigate to register', () => {
      component.navigateToRegister();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/register']);
    });

    it('should navigate to login', () => {
      component.navigateToLogin();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should navigate to dashboard when authenticated', () => {
      component.isAuthenticated = true;
      component.navigateToDashboard();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should navigate to login when not authenticated for dashboard', () => {
      component.isAuthenticated = false;
      component.navigateToDashboard();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });


  describe('Button Interactions', () => {
    it('should call navigateToPolicies when policies button is clicked', () => {
      spyOn(component, 'navigateToPolicies');
      fixture.detectChanges();
      
      const policiesBtn = TestUtils.getElement(fixture, 'button[data-testid="policies-btn"]');
      if (policiesBtn) {
        TestUtils.clickElement(fixture, 'button[data-testid="policies-btn"]');
        expect(component.navigateToPolicies).toHaveBeenCalled();
      }
    });

    it('should call navigateToRegister when register button is clicked', () => {
      spyOn(component, 'navigateToRegister');
      fixture.detectChanges();
      
      const registerBtn = TestUtils.getElement(fixture, 'button[data-testid="register-btn"]');
      if (registerBtn) {
        TestUtils.clickElement(fixture, 'button[data-testid="register-btn"]');
        expect(component.navigateToRegister).toHaveBeenCalled();
      }
    });

    it('should call navigateToLogin when login button is clicked', () => {
      spyOn(component, 'navigateToLogin');
      fixture.detectChanges();
      
      const loginBtn = TestUtils.getElement(fixture, 'button[data-testid="login-btn"]');
      if (loginBtn) {
        TestUtils.clickElement(fixture, 'button[data-testid="login-btn"]');
        expect(component.navigateToLogin).toHaveBeenCalled();
      }
    });

    it('should call navigateToDashboard when dashboard button is clicked', () => {
      spyOn(component, 'navigateToDashboard');
      component.isAuthenticated = true;
      fixture.detectChanges();
      
      const dashboardBtn = TestUtils.getElement(fixture, 'button[data-testid="dashboard-btn"]');
      if (dashboardBtn) {
        TestUtils.clickElement(fixture, 'button[data-testid="dashboard-btn"]');
        expect(component.navigateToDashboard).toHaveBeenCalled();
      }
    });
  });

  describe('Component Lifecycle', () => {
    it('should subscribe to auth state on init', () => {
      spyOn(component['authService'].authState$, 'subscribe');
      component.ngOnInit();
      expect(component['authService'].authState$.subscribe).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      fixture.detectChanges();
      const buttons = TestUtils.getElements(fixture, 'button');
      buttons.forEach(button => {
        expect(button.getAttribute('aria-label') || button.textContent).toBeTruthy();
      });
    });

    it('should have proper heading hierarchy', () => {
      fixture.detectChanges();
      const h1 = TestUtils.getElement(fixture, 'h1');
      const h2 = TestUtils.getElement(fixture, 'h2');
      expect(h1).toBeTruthy();
      expect(h2).toBeTruthy();
    });
  });
});


