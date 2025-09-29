import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ClaimSubmitComponent } from './components/claims/claim-submit/claim-submit.component';
import { PaymentRecordComponent } from './components/payments/payment-record/payment-record.component';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { authGuard } from './shared/guards/auth.guard';
import { roleGuard } from './shared/guards/role.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'policies', 
    loadChildren: () => import('./pages/policies/policies.routes').then(m => m.policiesRoutes),
    canActivate: [authGuard]
  },
  { 
    path: 'dashboard', 
    loadChildren: () => import('./pages/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
    canActivate: [authGuard],
    resolve: { role: () => import('./shared/resolvers/dashboard.resolver').then(m => m.DashboardResolver) }
  },
  { 
    path: 'claims/submit', 
    component: ClaimSubmitComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'claims', 
    loadComponent: () => import('./pages/claims/claims.component').then(m => m.ClaimsComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'claims/:id', 
    loadComponent: () => import('./pages/claims/claim-detail/claim-detail.component').then(m => m.ClaimDetailComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'payments/record', 
    component: PaymentRecordComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'payments', 
    loadComponent: () => import('./pages/payments/payments.component').then(m => m.PaymentsComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'admin/agents', 
    loadComponent: () => import('./pages/admin/agent-management/agent-management.component').then(m => m.AgentManagementComponent),
    canActivate: [authGuard, roleGuard(['admin'])]
  },
  { 
    path: 'admin/policies', 
    loadComponent: () => import('./pages/admin/policy-management/policy-management.component').then(m => m.PolicyManagementComponent),
    canActivate: [authGuard, roleGuard(['admin'])]
  },
  { 
    path: 'admin/audit-logs', 
    loadComponent: () => import('./pages/admin/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),
    canActivate: [authGuard, roleGuard(['admin'])]
  },
  { 
    path: 'admin/users', 
    loadComponent: () => import('./pages/admin/user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [authGuard, roleGuard(['admin'])]
  },
  { 
    path: 'admin/claims', 
    loadComponent: () => import('./pages/admin/claim-management/claim-management.component').then(m => m.ClaimManagementComponent),
    canActivate: [authGuard, roleGuard(['admin'])]
  },
  { 
    path: 'agent/claims', 
    loadComponent: () => import('./pages/agent/claim-management/claim-management.component').then(m => m.AgentClaimManagementComponent),
    canActivate: [authGuard, roleGuard(['agent'])]
  },
  { 
    path: 'agent/customers', 
    loadComponent: () => import('./pages/agent/customer-management/customer-management.component').then(m => m.AgentCustomerManagementComponent),
    canActivate: [authGuard, roleGuard(['agent'])]
  },
  { 
    path: 'agent/policies', 
    loadComponent: () => import('./pages/agent/policy-assignment/policy-assignment.component').then(m => m.AgentPolicyAssignmentComponent),
    canActivate: [authGuard, roleGuard(['agent'])]
  },
  { 
    path: 'agent/commission', 
    loadComponent: () => import('./pages/agent/commission-tracking/commission-tracking.component').then(m => m.AgentCommissionTrackingComponent),
    canActivate: [authGuard, roleGuard(['agent'])]
  },
  { path: '**', redirectTo: '/' }
];
