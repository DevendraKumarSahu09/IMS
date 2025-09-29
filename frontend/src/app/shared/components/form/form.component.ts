import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.css'
})
export class FormComponent {
  @Input() formGroup!: FormGroup;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showFooter = true;

  @Output() formSubmit = new EventEmitter<FormGroup>();

  onSubmit() {
    if (this.formGroup.valid) {
      this.formSubmit.emit(this.formGroup);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.formGroup.controls).forEach(key => {
      const control = this.formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
