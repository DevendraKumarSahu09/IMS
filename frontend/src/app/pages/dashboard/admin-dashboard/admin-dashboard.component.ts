import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../store';
import { selectUser } from '../../../store/auth/auth.selectors';
import { HttpService } from '../../../services/http.service';

interface AdminStats {
  totalUsers: number;
  totalPolicies: number;
  pendingClaims: number;
  totalPayments: number;
  activeAgents: number;
  monthlyRevenue: number;
}

interface Agent {
  _id: string;
  name: string;
  email: string;
  role: string;
  assignedPolicies: number;
  assignedClaims: number;
  createdAt: string;
}

interface AuditLog {
  _id: string;
  action: string;
  actorId?: {
    name: string;
    email: string;
    role: string;
  };
  details: any;
  ip: string;
  timestamp: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  user$: Observable<any>;
  stats: AdminStats = {
    totalUsers: 0,
    totalPolicies: 0,
    pendingClaims: 0,
    totalPayments: 0,
    activeAgents: 0,
    monthlyRevenue: 0
  };
  agents: Agent[] = [];
  recentAuditLogs: AuditLog[] = [];
  recentUsers: User[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private store: Store<AppState>,
    private httpService: HttpService,
    private router: Router
  ) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    this.loadAdminData();
  }

  loadAdminData(): void {
    this.loading = true;
    this.error = null;

    // Load admin summary stats
    this.httpService.get('/admin/summary').subscribe({
      next: (response: any) => {
        this.stats = {
          totalUsers: response.totalUsers || 0,
          totalPolicies: response.totalPolicies || 0,
          pendingClaims: response.pendingClaims || 0,
          totalPayments: response.totalPayments || 0,
          activeAgents: response.activeAgents || 0,
          monthlyRevenue: response.totalPayments || 0
        };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading admin stats:', error);
        this.error = 'Failed to load dashboard data';
        this.loading = false;
      }
    });

    // Load agents
    this.httpService.get('/agents').subscribe({
      next: (response: any) => {
        this.agents = Array.isArray(response) ? response : [];
      },
      error: (error) => {
        console.error('Error loading agents:', error);
      }
    });

    // Load recent audit logs
    this.httpService.get('/admin/audit?limit=10').subscribe({
      next: (response: any) => {
        this.recentAuditLogs = Array.isArray(response) ? response : [];
      },
      error: (error) => {
        console.error('Error loading audit logs:', error);
      }
    });

    // Load recent users
    this.httpService.get('/admin/users?limit=5').subscribe({
      next: (response: any) => {
        this.recentUsers = response.success ? response.data || [] : [];
      },
      error: (error) => {
        console.error('Error loading recent users:', error);
      }
    });
  }

  formatCurrency(amount: number): string {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActionIcon(action: string): string {
    switch (action.toLowerCase()) {
      case 'login': return '🔐';
      case 'policy purchase': return '📋';
      case 'claim submission': return '📝';
      case 'claim status update': return '✅';
      case 'user registration': return '👤';
      case 'policy cancellation': return '❌';
      default: return '📄';
    }
  }

  createAgent(): void {
    // Navigate to agent management page
    this.router.navigate(['/admin/agents']);
  }

  assignAgent(agentId: string): void {
    // Navigate to agent management page with specific agent
    this.router.navigate(['/admin/agents'], { queryParams: { agent: agentId } });
  }

  navigateToAgents(): void {
    this.router.navigate(['/admin/agents']);
  }

  navigateToAuditLogs(): void {
    this.router.navigate(['/admin/audit-logs']);
  }

  navigateToPolicies(): void {
    this.router.navigate(['/admin/policies']);
  }

  navigateToUsers(): void {
    this.router.navigate(['/admin/users']);
  }

  navigateToClaims(): void {
    this.router.navigate(['/admin/claims']);
  }

  refreshData(): void {
    this.loadAdminData();
  }

  getRoleColor(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin': return 'badge-error';
      case 'agent': return 'badge-warning';
      case 'customer': return 'badge-info';
      default: return 'badge-neutral';
    }
  }

  getRoleDisplay(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin': return 'Administrator';
      case 'agent': return 'Agent';
      case 'customer': return 'Customer';
      default: return role;
    }
  }
}
