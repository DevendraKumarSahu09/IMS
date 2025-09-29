import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppState } from '../../../store';
import { selectUserRole } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-dashboard-redirect',
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="loading loading-spinner loading-lg"></div>
    </div>
  `
})
export class DashboardRedirectComponent implements OnInit {
  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.store.select(selectUserRole).pipe(take(1)).subscribe(role => {
      switch (role) {
        case 'admin':
          this.router.navigate(['/dashboard/admin']);
          break;
        case 'agent':
          this.router.navigate(['/dashboard/agent']);
          break;
        case 'customer':
          this.router.navigate(['/dashboard/user']);
          break;
        default:
          this.router.navigate(['/login']);
          break;
      }
    });
  }
}
