import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NotificationComponent } from './shared/components/notification/notification.component';
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle.component';
import { AuthService } from './services/auth.service';
import { User } from './store/auth/auth.state';
import { Store } from '@ngrx/store';
import { AppState } from './store';
import { selectAuthState } from './store/auth/auth.selectors';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationComponent, ThemeToggleComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'IMS - Insurance Management System';
  isMobileMenuOpen = false;
  isAuthenticated = false;
  currentUser: User | null = null;
  currentRoute = '';
  private authSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private store: Store<AppState>
  ) {}

  ngOnInit() {
    // Set initial route
    this.currentRoute = this.router.url;

    // Subscribe to auth service directly for immediate updates
    this.authSubscription = this.authService.authState$.subscribe(state => {
      console.log('App component auth state update:', state);
      this.isAuthenticated = state.isAuthenticated;
      this.currentUser = state.user;
    });

    // Track current route
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentRoute = (event as NavigationEnd).url;
      });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.isMobileMenuOpen = false;
  }

  getUserDisplayName(): string {
    if (this.currentUser) {
      return this.currentUser.name;
    }
    return 'User';
  }

  getUserInitials(): string {
    if (this.currentUser) {
      const nameParts = this.currentUser.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return this.currentUser.name[0].toUpperCase();
    }
    return 'U';
  }

  isOnAuthPage(): boolean {
    return this.currentRoute === '/login' || this.currentRoute === '/register';
  }

  shouldShowNavigation(): boolean {
    return this.isAuthenticated && !this.isOnAuthPage();
  }

}
