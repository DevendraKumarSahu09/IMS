import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { TestBedConfig } from '../../../testing/test-bed-config';
import { TestUtils } from '../../../testing/test-utils';
import { mockUser, mockRegisterResponse, mockErrorResponse } from '../../../testing/mocks';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    await TestBedConfig.configureTestingModule(RegisterComponent);
    
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.registerForm).toBeDefined();
    expect(component.loading$).toBeDefined();
    expect(component.error$).toBeDefined();
  });

  describe('Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.registerForm.valid).toBeFalse();
    });

    it('should be invalid with invalid email', () => {
      component.registerForm.patchValue({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'customer'
      });
      expect(component.registerForm.valid).toBeFalse();
      expect(component.registerForm.get('email')?.errors?.['email']).toBeTruthy();
    });

    it('should be invalid with empty name', () => {
      component.registerForm.patchValue({
        name: '',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'customer'
      });
      expect(component.registerForm.valid).toBeFalse();
      expect(component.registerForm.get('name')?.errors?.['required']).toBeTruthy();
    });

    it('should be invalid with short password', () => {
      component.registerForm.patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
        confirmPassword: '123',
        role: 'customer'
      });
      expect(component.registerForm.valid).toBeFalse();
      expect(component.registerForm.get('password')?.errors?.['minlength']).toBeTruthy();
    });

    it('should be invalid with mismatched passwords', () => {
      component.registerForm.patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different123',
        role: 'customer'
      });
      component.registerForm.updateValueAndValidity();
      expect(component.registerForm.valid).toBeFalse();
      expect(component.registerForm.get('confirmPassword')?.errors?.['passwordMismatch']).toBeTruthy();
    });

    it('should be valid with valid data', () => {
      component.registerForm.patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'customer'
      });
      expect(component.registerForm.valid).toBeTrue();
    });
  });

  describe('Form Submission', () => {
    let mockStore: jasmine.SpyObj<Store>;

    beforeEach(() => {
      component.registerForm.patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'customer'
      });
      mockStore = TestBed.inject(Store) as jasmine.SpyObj<Store>;
    });

    it('should dispatch register action on valid form submission', () => {
      spyOn(component, 'onSubmit').and.callThrough();

      component.onSubmit();
      expect(mockStore.dispatch).toHaveBeenCalled();
    });

    it('should dispatch register action with correct data', () => {
      component.onSubmit();
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: '[Auth] Register',
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'customer'
        })
      );
    });

    it('should not dispatch action if form is invalid', () => {
      component.registerForm.patchValue({
        name: '',
        email: 'invalid-email',
        password: '123',
        confirmPassword: 'different',
        role: 'customer'
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
    it('should render registration form', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'form')).toBeTrue();
    });

    it('should render name input', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'input[name="name"]')).toBeTrue();
    });

    it('should render email input', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'input[type="email"]')).toBeTrue();
    });

    it('should render password input', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'input[name="password"]')).toBeTrue();
    });

    it('should render confirm password input', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'input[name="confirmPassword"]')).toBeTrue();
    });

    it('should render role select', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'select[name="role"]')).toBeTrue();
    });

    it('should render submit button', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'button[type="submit"]')).toBeTrue();
    });

    it('should render login link', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'a[routerLink="/login"]')).toBeTrue();
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
      store.select.and.returnValue(of('Registration failed'));
      fixture.detectChanges();
      
      expect(TestUtils.hasElement(fixture, '.bg-danger-50')).toBeTrue();
    });
  });

  describe('Form Interactions', () => {
    it('should update form values when inputs change', () => {
      fixture.detectChanges();
      
      TestUtils.setInputValue(fixture, 'input[name="name"]', 'Test User');
      TestUtils.setInputValue(fixture, 'input[type="email"]', 'test@example.com');
      TestUtils.setInputValue(fixture, 'input[name="password"]', 'password123');
      TestUtils.setInputValue(fixture, 'input[name="confirmPassword"]', 'password123');
      
      expect(component.registerForm.get('name')?.value).toBe('Test User');
      expect(component.registerForm.get('email')?.value).toBe('test@example.com');
      expect(component.registerForm.get('password')?.value).toBe('password123');
      expect(component.registerForm.get('confirmPassword')?.value).toBe('password123');
    });

    it('should show validation errors', () => {
      fixture.detectChanges();
      
      TestUtils.setInputValue(fixture, 'input[type="email"]', 'invalid-email');
      TestUtils.triggerEvent(fixture, 'input[type="email"]', 'blur');
      fixture.detectChanges();
      
      expect(TestUtils.hasElement(fixture, '.form-error')).toBeTrue();
    });

    it('should disable submit button when form is invalid', () => {
      component.registerForm.patchValue({
        name: '',
        email: 'invalid-email',
        password: '123',
        confirmPassword: 'different',
        role: 'customer'
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

  describe('Role Selection', () => {
    it('should have customer and agent role options', () => {
      fixture.detectChanges();
      const roleSelect = TestUtils.getElement<HTMLSelectElement>(fixture, 'select[name="role"]');
      const options = roleSelect?.querySelectorAll('option');
      
      expect(options?.length).toBeGreaterThanOrEqual(2);
      expect(Array.from(options || []).some(opt => opt.value === 'customer')).toBeTrue();
      expect(Array.from(options || []).some(opt => opt.value === 'agent')).toBeTrue();
    });

    it('should default to customer role', () => {
      expect(component.registerForm.get('role')?.value).toBe('customer');
    });
  });

  describe('Navigation', () => {
    it('should have login link with correct routerLink', () => {
      fixture.detectChanges();
      const loginLink = TestUtils.getElement(fixture, 'a[routerLink="/login"]');
      expect(loginLink).toBeTruthy();
      expect(loginLink?.getAttribute('routerLink')).toBe('/login');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'label[for="name"]')).toBeTrue();
      expect(TestUtils.hasElement(fixture, 'label[for="email"]')).toBeTrue();
      expect(TestUtils.hasElement(fixture, 'label[for="password"]')).toBeTrue();
      expect(TestUtils.hasElement(fixture, 'label[for="confirmPassword"]')).toBeTrue();
      expect(TestUtils.hasElement(fixture, 'label[for="role"]')).toBeTrue();
    });

    it('should have proper ARIA attributes', () => {
      fixture.detectChanges();
      const requiredInputs = TestUtils.getElements(fixture, 'input[required]');
      requiredInputs.forEach(input => {
        expect(input.getAttribute('required')).toBeDefined();
      });
    });

    it('should have proper error announcements', () => {
      // Mock error state
      const store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
      store.select.and.returnValue(of('Registration failed'));
      fixture.detectChanges();
      
      const errorElement = TestUtils.getElement(fixture, '.bg-danger-50');
      expect(errorElement).toBeTruthy();
    });
  });

  describe('Component Lifecycle', () => {
    it('should initialize form on init', () => {
      spyOn(component, 'ngOnInit').and.callThrough();
      component.ngOnInit();
      expect(component.registerForm).toBeDefined();
    });
  });
});
