import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of, throwError, Subject } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PaymentRecordComponent } from './payment-record.component';
import { TestBedConfig } from '../../../testing/test-bed-config';
import { TestUtils } from '../../../testing/test-utils';
import { mockUser, mockPolicy, mockUserPolicy, mockErrorResponse } from '../../../testing/mocks';

describe('PaymentRecordComponent', () => {
  let component: PaymentRecordComponent;
  let fixture: ComponentFixture<PaymentRecordComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockStore: jasmine.SpyObj<Store>;

  beforeEach(async () => {
    await TestBedConfig.configureTestingModule(PaymentRecordComponent);
    
    fixture = TestBed.createComponent(PaymentRecordComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockStore = TestBed.inject(Store) as jasmine.SpyObj<Store>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  describe('Component Initialization', () => {
    it('should load user policies on init', () => {
      spyOn(component, 'loadUserPolicies');
      spyOn(component, 'loadPaymentMethods');
      component.ngOnInit();
      expect(component.loadUserPolicies).toHaveBeenCalled();
      expect(component.loadPaymentMethods).toHaveBeenCalled();
    });
  });

  describe('User Policies Loading', () => {
    it('should load user policies successfully', () => {
      const mockPolicyService = TestBed.inject('PolicyService' as any) as any;
      (mockPolicyService.getUserPolicies as jasmine.Spy).and.returnValue(of({ data: [mockUserPolicy] }));

      component.loadUserPolicies();

      expect(component.userPolicies).toEqual([mockUserPolicy]);
      expect(component.loading).toBeFalse();
    });

    it('should handle user policies loading error', () => {
      const mockPolicyService = TestBed.inject('PolicyService' as any) as any;
      (mockPolicyService.getUserPolicies as jasmine.Spy).and.returnValue(of({ error: 'Failed to load policies' }));

      component.loadUserPolicies();

      expect(component.loading).toBeFalse();
    });
  });

  describe('Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.paymentForm.valid).toBeFalse();
    });

    it('should be invalid with invalid policy selection', () => {
      component.paymentForm.patchValue({
        userPolicyId: '',
        amount: 1000,
        method: 'CARD',
        reference: 'PAY001'
      });
      expect(component.paymentForm.valid).toBeFalse();
      expect(component.paymentForm.get('userPolicyId')?.errors?.['required']).toBeTruthy();
    });

    it('should be invalid with negative amount', () => {
      component.paymentForm.patchValue({
        userPolicyId: '1',
        amount: -100,
        method: 'CARD',
        reference: 'PAY001'
      });
      expect(component.paymentForm.valid).toBeFalse();
      expect(component.paymentForm.get('amount')?.errors?.['min']).toBeTruthy();
    });

    it('should be invalid with empty payment method', () => {
      component.paymentForm.patchValue({
        userPolicyId: '1',
        amount: 1000,
        paymentMethod: '',
        paymentDetails: {
          cardNumber: '1234567890123456',
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'Test User'
        }
      });
      expect(component.paymentForm.valid).toBeFalse();
      expect(component.paymentForm.get('paymentMethod')?.errors?.['required']).toBeTruthy();
    });

    it('should be invalid with empty userPolicyId', () => {
      component.paymentForm.patchValue({
        userPolicyId: '',
        amount: 1000,
        paymentMethod: 'CARD',
        paymentDetails: {
          cardNumber: '1234567890123456',
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'Test User'
        }
      });
      expect(component.paymentForm.valid).toBeFalse();
      expect(component.paymentForm.get('userPolicyId')?.errors?.['required']).toBeTruthy();
    });

    it('should be valid with valid data', () => {
      component.paymentForm.patchValue({
        userPolicyId: '1',
        amount: 1000,
        paymentMethod: 'CARD',
        paymentDetails: {
          cardNumber: '1234567890123456',
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'Test User'
        }
      });
      expect(component.paymentForm.valid).toBeTrue();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.paymentForm.patchValue({
        userPolicyId: '1',
        amount: 1000,
        paymentMethod: 'CARD',
        paymentDetails: {
          cardNumber: '1234567890123456',
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'Test User'
        }
      });
    });


    it('should navigate to payments page on successful submission', () => {
      const mockPaymentService = TestBed.inject('PaymentService' as any) as any;
      (mockPaymentService.createPayment as jasmine.Spy).and.returnValue(of({ success: true }));

      // Submit the form
      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      fixture.detectChanges();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/payments']);
    });

    it('should handle payment submission error', () => {
      const mockPaymentService = TestBed.inject('PaymentService' as any) as any;
      (mockPaymentService.createPayment as jasmine.Spy).and.returnValue(throwError(() => mockErrorResponse));

      // Submit the form
      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      fixture.detectChanges();

      expect(component.submitting).toBeFalse();
    });

    it('should not submit if form is invalid', () => {
      component.paymentForm.patchValue({
        userPolicyId: '',
        amount: -100,
        paymentMethod: '',
        paymentDetails: {
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: ''
        }
      });

      const mockPaymentService = TestBed.inject('PaymentService' as any) as any;
      (mockPaymentService.createPayment as jasmine.Spy).and.stub();

      // Submit the form
      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      fixture.detectChanges();

      expect(mockPaymentService.createPayment).not.toHaveBeenCalled();
    });
  });

  describe('Template Rendering', () => {
    it('should render payment recording form', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'form')).toBeTrue();
    });

    it('should render amount input', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'input[type="number"]')).toBeTrue();
    });

    it('should render submit button', () => {
      fixture.detectChanges();
      expect(TestUtils.hasElement(fixture, 'button[type="submit"]')).toBeTrue();
    });
  });




});
