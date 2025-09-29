import { Routes } from '@angular/router';
import { DashboardResolver } from '../../shared/resolvers/dashboard.resolver';
import { roleGuard } from '../../shared/guards/role.guard';

export const dashboardRoutes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./dashboard-redirect/dashboard-redirect.component').then(m => m.DashboardRedirectComponent)
  },
  { 
    path: 'user', 
    loadComponent: () => import('./user-dashboard/user-dashboard.component').then(m => m.UserDashboardComponent),
    canActivate: [roleGuard(['customer'])]
  },
  { 
    path: 'agent', 
    loadComponent: () => import('./agent-dashboard/agent-dashboard.component').then(m => m.AgentDashboardComponent),
    canActivate: [roleGuard(['agent'])]
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [roleGuard(['admin'])]
  }
];
