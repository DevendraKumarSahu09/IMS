import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

/**
 * Test utilities for Angular component testing
 */
export class TestUtils {
  /**
   * Get element by CSS selector
   */
  static getElement<T = HTMLElement>(
    fixture: ComponentFixture<any>,
    selector: string
  ): T | null {
    const element = fixture.debugElement.query(By.css(selector));
    return element ? element.nativeElement : null;
  }

  /**
   * Get all elements by CSS selector
   */
  static getElements<T = HTMLElement>(
    fixture: ComponentFixture<any>,
    selector: string
  ): T[] {
    const elements = fixture.debugElement.queryAll(By.css(selector));
    return elements.map(el => el.nativeElement);
  }

  /**
   * Get debug element by CSS selector
   */
  static getDebugElement(
    fixture: ComponentFixture<any>,
    selector: string
  ): DebugElement | null {
    return fixture.debugElement.query(By.css(selector));
  }

  /**
   * Get all debug elements by CSS selector
   */
  static getDebugElements(
    fixture: ComponentFixture<any>,
    selector: string
  ): DebugElement[] {
    return fixture.debugElement.queryAll(By.css(selector));
  }

  /**
   * Trigger event on element
   */
  static triggerEvent(
    fixture: ComponentFixture<any>,
    selector: string,
    eventName: string,
    eventObj: any = {}
  ): void {
    const element = this.getElement(fixture, selector);
    if (element) {
      element.dispatchEvent(new Event(eventName, eventObj));
      fixture.detectChanges();
    }
  }

  /**
   * Set input value
   */
  static setInputValue(
    fixture: ComponentFixture<any>,
    selector: string,
    value: string
  ): void {
    const input = this.getElement<HTMLInputElement>(fixture, selector);
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }
  }

  /**
   * Click element
   */
  static clickElement(
    fixture: ComponentFixture<any>,
    selector: string
  ): void {
    const element = this.getElement(fixture, selector);
    if (element) {
      element.click();
      fixture.detectChanges();
    }
  }

  /**
   * Check if element exists
   */
  static hasElement(
    fixture: ComponentFixture<any>,
    selector: string
  ): boolean {
    return this.getElement(fixture, selector) !== null;
  }

  /**
   * Get text content of element
   */
  static getTextContent(
    fixture: ComponentFixture<any>,
    selector: string
  ): string {
    const element = this.getElement(fixture, selector);
    return element ? element.textContent?.trim() || '' : '';
  }

  /**
   * Check if element has class
   */
  static hasClass(
    fixture: ComponentFixture<any>,
    selector: string,
    className: string
  ): boolean {
    const element = this.getElement(fixture, selector);
    return element ? element.classList.contains(className) : false;
  }

  /**
   * Wait for async operations
   */
  static async waitForAsync(fn: () => void): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        fn();
        resolve();
      }, 0);
    });
  }
}


