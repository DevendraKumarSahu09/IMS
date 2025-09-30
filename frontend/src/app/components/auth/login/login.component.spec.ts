import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { TestBedConfig } from '../../../testing/test-bed-config';
import { TestUtils } from '../../../testing/test-utils';
import { mockUser, mockLoginResponse, mockErrorResponse } from '../../../testing/mocks';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    await TestBedConfig.configureTestingModule(LoginComponent);
    
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loading$).toBeDefined();
    expect(component.error$).toBeDefined();
  });

  describe('Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.loginForm.valid).toBeFalse();
    });

    it('should be invalid with invalid email', () => {
      component.loginForm.patchValue({
        email: 'invalid-email',
        password: 'password123'
      });
      expect(component.loginForm.valid).toBeFalse();
      expect(component.loginForm.get('email')?.errors?.['email']).toBeTruthy();
    });

    it('should be invalid with empty password', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: ''
      });
      expect(component.loginForm.valid).toBeFalse();
      expect(component.loginForm.get('password')?.errors?.['required']).toBeTruthy();
    });

    it('should be valid with valid credentials', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(component.loginForm.valid).toBeTrue();
    });
  });

  describe('Form Submission', () => {
    let mockStore: jasmine.SpyObj<Store>;

    beforeEach(() => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      mockStore = TestBed.inject(Store) as jasmine.SpyObj<Store>;
    });

    it('should dispatch login action on valid form submission', () => {
      spyOn(component, 'onSubmit').and.callThrough();

      component.onSubmit();
      expect(mockStore.dispatch).toHaveBeenCalled();
    });

    it('should dispatch login action with correct credentials', () => {
      component.onSubmit();
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: '[Auth] Login',
          email: 'test@example.com',
          password: 'password123'
        })
      );
    });

    it('should not dispatch action if form is invalid', () => {
      component.loginForm.patchValue({
        email: 'invalid-email',
        password: ''
      });

      component.onSubmit();
      expect(mockStore.dispatch).not.toHaveBeenCalled();
    });

    it('should clear error on init', () => {
      spyOn(component, 'ngOnInit').and.callThrough();
      component.ngOnInit();
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: '[Auth] Clear Error'
        })
      );
    });
  });

  describe('Template Rendering', () => {
    it('should render login form', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'form')).toBeTrue();
    });

    it('should render email input', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'input[type="email"]')).toBeTrue();
    });

    it('should render password input', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'input[type="password"]')).toBeTrue();
    });

    it('should render submit button', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'button[type="submit"]')).toBeTrue();
    });

    it('should render register link', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'a[routerLink="/register"]')).toBeTrue();
    });

    it('should show loading state when loading', () => {
      // Mock loading state
      const store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
      store.select.and.returnValue(of(true));
      fixture.detectChanges();
      
      expect(TestUtils.hasElement(fixture, 'button[disabled]')).toBeTrue();
    });

    it('should show error message when error exists', () => {
      // Mock error state
      const store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
      store.select.and.returnValue(of('Login failed'));
      fixture.detectChanges();
      
      expect(TestUtils.hasElement(fixture, '.bg-danger-50')).toBeTrue();
    });
  });

  describe('Form Interactions', () => {
    it('should update form values when inputs change', () => {
      fixture.detectChanges();
      
      TestUtils.setInputValue(fixture, 'input[type="email"]', 'test@example.com');
      TestUtils.setInputValue(fixture, 'input[type="password"]', 'password123');
      
      expect(component.loginForm.get('email')?.value).toBe('test@example.com');
      expect(component.loginForm.get('password')?.value).toBe('password123');
    });

    it('should show validation errors', () => {
      fixture.detectChanges();
      
      TestUtils.setInputValue(fixture, 'input[type="email"]', 'invalid-email');
      TestUtils.triggerEvent(fixture, 'input[type="email"]', 'blur');
      fixture.detectChanges();
      
      expect(TestUtils.hasElement(fixture, '.form-error')).toBeTrue();
    });

    it('should disable submit button when form is invalid', () => {
      component.loginForm.patchValue({
        email: 'invalid-email',
        password: ''
      });
      fixture.detectChanges();
      
      const submitBtn = TestUtils.getElement<HTMLButtonElement>(fixture, 'button[type="submit"]');
      expect(submitBtn?.disabled).toBeTrue();
    });

    it('should have submit button', () => {
      fixture.detectChanges();
      
      const submitBtn = TestUtils.getElement<HTMLButtonElement>(fixture, 'button[type="submit"]');
      expect(submitBtn).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should have register link with correct routerLink', () => {
      fixture.detectChanges();
      const registerLink = TestUtils.getElement(fixture, 'a[routerLink="/register"]');
      expect(registerLink).toBeTruthy();
      expect(registerLink?.getAttribute('routerLink')).toBe('/register');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'label[for="email"]')).toBeTrue();
      expect(TestUtils.hasElement(fixture, 'label[for="password"]')).toBeTrue();
    });

    it('should have proper ARIA attributes', () => {
      fixture.detectChanges();
      const emailInput = TestUtils.getElement(fixture, 'input[type="email"]');
      const passwordInput = TestUtils.getElement(fixture, 'input[type="password"]');
      
      expect(emailInput?.getAttribute('required')).toBeDefined();
      expect(passwordInput?.getAttribute('required')).toBeDefined();
    });

    it('should have proper error announcements', () => {
      // Mock error state
      const store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
      store.select.and.returnValue(of('Login failed'));
      fixture.detectChanges();
      
      const errorElement = TestUtils.getElement(fixture, '.bg-danger-50');
      expect(errorElement).toBeTruthy();
    });
  });

  describe('Component Lifecycle', () => {
    it('should initialize form on init', () => {
      spyOn(component, 'ngOnInit').and.callThrough();
      component.ngOnInit();
      expect(component.loginForm).toBeDefined();
    });
  });
});
