import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css',
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.notifications$.subscribe(
      (notifications: Notification[]) => this.notifications = notifications
    );
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  remove(id: string) {
    this.notificationService.remove(id);
  }

  getNotificationClass(type: string): string {
    const classes = {
      success: 'notification-success',
      error: 'notification-error',
      warning: 'notification-warning',
      info: 'notification-info'
    };
    return classes[type as keyof typeof classes] || 'notification-info';
  }

  trackByFn(index: number, item: Notification): string {
    return item.id;
  }
}
