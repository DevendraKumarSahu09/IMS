import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() size: ModalSize = 'md';
  @Input() showCloseButton = true;
  @Input() showFooter = false;
  @Input() closeOnOverlayClick = true;
  @Input() closeOnEscape = true;

  @Output() closed = new EventEmitter<void>();

  get sizeClass(): string {
    const sizeClasses = {
      sm: 'modal-sm',
      md: 'modal-md',
      lg: 'modal-lg',
      xl: 'modal-xl',
      full: 'modal-full'
    };
    return sizeClasses[this.size];
  }

  close() {
    this.isOpen = false;
    this.closed.emit();
  }

  onOverlayClick(event: Event) {
    if (this.closeOnOverlayClick && event.target === event.currentTarget) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.closeOnEscape && this.isOpen) {
      this.close();
    }
  }
}
