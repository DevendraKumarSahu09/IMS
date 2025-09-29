import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../store';
import { selectUser } from '../../../store/auth/auth.selectors';
import { HttpService } from '../../../services/http.service';

interface AuditLog {
  _id: string;
  action: string;
  actorId: string;
  details: any;
  ip: string;
  timestamp: string;
  actor?: {
    name: string;
    email: string;
    role: string;
  };
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.css'
})
export class AuditLogsComponent implements OnInit {
  user$: Observable<any>;
  auditLogs: AuditLog[] = [];
  loading = true;
  error: string | null = null;
  currentPage = 1;
  pageSize = 20;
  totalLogs = 0;
  filters = {
    action: '',
    actorId: '',
    dateFrom: '',
    dateTo: ''
  };

  constructor(
    private store: Store<AppState>,
    private httpService: HttpService
  ) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.loading = true;
    this.error = null;

    const params = new URLSearchParams();
    params.set('page', this.currentPage.toString());
    params.set('limit', this.pageSize.toString());
    
    if (this.filters.action) params.set('action', this.filters.action);
    if (this.filters.actorId) params.set('actorId', this.filters.actorId);
    if (this.filters.dateFrom) params.set('dateFrom', this.filters.dateFrom);
    if (this.filters.dateTo) params.set('dateTo', this.filters.dateTo);

    console.log('Loading audit logs with filters:', this.filters);
    console.log('Request URL:', `/admin/audit?${params.toString()}`);

    this.httpService.get(`/admin/audit?${params.toString()}`).subscribe({
      next: (response: any) => {
        console.log('Audit logs response:', response);
        this.auditLogs = response.logs || [];
        this.totalLogs = response.total || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading audit logs:', error);
        this.error = 'Failed to load audit logs';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadAuditLogs();
  }

  clearFilters(): void {
    this.filters = {
      action: '',
      actorId: '',
      dateFrom: '',
      dateTo: ''
    };
    this.currentPage = 1;
    this.loadAuditLogs();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadAuditLogs();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalLogs / this.pageSize);
  }

  getMaxDisplayed(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalLogs);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
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
      case 'payment': return '💳';
      case 'logout': return '🚪';
      case 'policy creation': return '➕';
      case 'policy update': return '✏️';
      case 'policy deletion': return '🗑️';
      case 'user update': return '👤';
      case 'user deletion': return '❌';
      default: return '📄';
    }
  }

  getActionColor(action: string): string {
    switch (action.toLowerCase()) {
      case 'login': return 'text-green-600';
      case 'policy purchase': return 'text-blue-600';
      case 'claim submission': return 'text-yellow-600';
      case 'claim status update': return 'text-purple-600';
      case 'user registration': return 'text-indigo-600';
      case 'policy cancellation': return 'text-red-600';
      case 'payment': return 'text-emerald-600';
      case 'logout': return 'text-gray-600';
      case 'policy creation': return 'text-green-600';
      case 'policy update': return 'text-blue-600';
      case 'policy deletion': return 'text-red-600';
      case 'user update': return 'text-indigo-600';
      case 'user deletion': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  exportLogs(): void {
    // This would implement CSV/Excel export functionality
    console.log('Exporting audit logs...');
    alert('Export functionality would be implemented here');
  }

  hasDetails(details: any): boolean {
    if (!details) return false;
    return !!(details.description || details.amountClaimed || details.status || 
              details.notes || details.policyId || details.policyCode || 
              details.policyTitle || details.targetUserId || details.changes);
  }

  formatChanges(changes: any): string {
    if (!changes || typeof changes !== 'object') return '';
    
    const changeStrings = Object.keys(changes).map(key => {
      const value = changes[key];
      if (typeof value === 'object') {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${value}`;
    });
    
    return changeStrings.join(', ');
  }
}
