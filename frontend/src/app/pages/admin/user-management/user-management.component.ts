import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../store';
import { selectUser } from '../../../store/auth/auth.selectors';
import { HttpService } from '../../../services/http.service';
import { NotificationService } from '../../../shared/services/notification.service';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
  assignedClaims?: number;
}

interface UserUpdateRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

interface UserFilters {
  role: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UserStats {
  total: number;
  agents: number;
  admins: number;
  customers: number;
  assignedClaims?: number;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit, OnDestroy {
  user$: Observable<any>;
  users: User[] = [];
  loading = true;
  error: string | null = null;
  pagination: PaginationInfo = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };
  searchQuery = '';
  filters: UserFilters = {
    role: ''
  };
  selectedUsers: string[] = [];
  bulkAction = '';
  editingUser: User | null = null;
  showEditForm = false;
  showAddForm = false;
  userUpdate: UserUpdateRequest = {};
  newUser: UserUpdateRequest = {};
  filterTimeout: any;
  
  // Assignment modals
  showPolicyAssignmentModal = false;
  showClaimAssignmentModal = false;
  selectedUserForAssignment: User | null = null;
  availablePolicies: any[] = [];
  availableClaims: any[] = [];
  selectedPolicyId = '';
  selectedClaimId = '';
  
  // Make Math available in template
  Math = Math;

  constructor(
    private store: Store<AppState>,
    private httpService: HttpService,
    private notificationService: NotificationService
  ) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    const params = new URLSearchParams();
    params.set('page', this.pagination.page.toString());
    params.set('limit', this.pagination.limit.toString());
    if (this.searchQuery) {
      params.set('search', this.searchQuery);
    }
    if (this.filters.role) {
      params.set('role', this.filters.role);
    }

    this.httpService.get(`/admin/users?${params.toString()}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.users = response.data || [];
          this.pagination = response.pagination || this.pagination;
        } else {
          this.users = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = 'Failed to load users';
        this.loading = false;
        this.notificationService.error('Error', 'Failed to load users');
      }
    });
  }

  searchUsers(): void {
    this.pagination.page = 1;
    this.loadUsers();
  }

  onSearchChange(): void {
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.searchUsers();
    }, 500);
  }

  onFilterChange(): void {
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.searchUsers();
    }, 500);
  }

  clearFilters(): void {
    this.filters = {
      role: ''
    };
    this.searchQuery = '';
    this.pagination.page = 1;
    this.loadUsers();
  }

  getUserStats(user?: User): UserStats {
    if (user) {
      // Return individual user stats
      return {
        total: 1,
        agents: user.role === 'agent' ? 1 : 0,
        admins: user.role === 'admin' ? 1 : 0,
        customers: user.role === 'customer' ? 1 : 0,
        assignedClaims: user.assignedClaims || 0
      };
    }

    // Return overall stats
    const total = this.users.length;
    const agents = this.users.filter(u => u.role === 'agent').length;
    const admins = this.users.filter(u => u.role === 'admin').length;
    const customers = this.users.filter(u => u.role === 'customer').length;

    return { total, agents, admins, customers };
  }

  selectUser(userId: string): void {
    const index = this.selectedUsers.indexOf(userId);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(userId);
    }
  }

  selectAllUsers(): void {
    if (this.selectedUsers.length === this.users.length) {
      this.selectedUsers = [];
    } else {
      this.selectedUsers = this.users.map(user => user._id);
    }
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUsers.includes(userId);
  }

  performBulkAction(): void {
    if (!this.bulkAction || this.selectedUsers.length === 0) return;

    const action = this.bulkAction;
    const userIds = this.selectedUsers;

    switch (action) {
      case 'delete':
        this.bulkDeleteUsers(userIds);
        break;
    }

    this.bulkAction = '';
    this.selectedUsers = [];
  }


  bulkDeleteUsers(userIds: string[]): void {
    if (confirm(`Are you sure you want to delete ${userIds.length} user(s)? This action cannot be undone.`)) {
      // Delete users one by one
      let completed = 0;
      let errors = 0;
      
      userIds.forEach(userId => {
        this.httpService.delete(`/admin/users/${userId}`).subscribe({
          next: () => {
            completed++;
            if (completed + errors === userIds.length) {
              this.loadUsers();
              this.selectedUsers = [];
              if (errors === 0) {
                this.notificationService.success('Bulk Delete', `Successfully deleted ${completed} user(s)`);
              } else {
                this.notificationService.warning('Bulk Delete', `Deleted ${completed} user(s), ${errors} failed`);
              }
            }
          },
          error: (error) => {
            errors++;
            if (completed + errors === userIds.length) {
              this.loadUsers();
              this.selectedUsers = [];
              this.notificationService.warning('Bulk Delete', `Deleted ${completed} user(s), ${errors} failed`);
            }
          }
        });
      });
    }
  }

  openAddUserModal(): void {
    this.showAddForm = true;
    this.newUser = {};
  }

  assignPolicy(user: User): void {
    this.selectedUserForAssignment = user;
    this.selectedPolicyId = '';
    this.loadAvailablePolicies();
    this.showPolicyAssignmentModal = true;
  }

  assignClaim(user: User): void {
    this.selectedUserForAssignment = user;
    this.selectedClaimId = '';
    this.loadAvailableClaims();
    this.showClaimAssignmentModal = true;
  }

  loadAvailablePolicies(): void {
    this.httpService.get('/policies').subscribe({
      next: (response: any) => {
        if (response.success) {
          this.availablePolicies = response.data || [];
        } else {
          this.availablePolicies = [];
        }
      },
      error: (error) => {
        console.error('Error loading policies:', error);
        this.availablePolicies = [];
      }
    });
  }

  loadAvailableClaims(): void {
    this.httpService.get('/admin/claims/unassigned').subscribe({
      next: (response: any) => {
        if (response.success) {
          this.availableClaims = response.data || [];
        } else {
          this.availableClaims = [];
        }
      },
      error: (error) => {
        console.error('Error loading claims:', error);
        this.availableClaims = [];
        this.notificationService.error('Error', 'Failed to load claims');
      }
    });
  }

  assignSelectedPolicy(): void {
    if (!this.selectedPolicyId || !this.selectedUserForAssignment) {
      this.notificationService.error('Error', 'Please select a policy');
      return;
    }

    // For now, we'll show a notification since policy assignment endpoint needs to be implemented
    this.notificationService.info('Policy Assignment', `Policy assignment feature will be implemented soon. Selected: ${this.selectedPolicyId} for ${this.selectedUserForAssignment.name}`);
    this.closePolicyAssignmentModal();
  }

  assignSelectedClaim(): void {
    if (!this.selectedClaimId || !this.selectedUserForAssignment) {
      this.notificationService.error('Error', 'Please select a claim');
      return;
    }

    this.httpService.post('/admin/claims/assign', {
      claimId: this.selectedClaimId,
      agentId: this.selectedUserForAssignment._id
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notificationService.success('Success', 'Claim assigned successfully!');
          this.loadUsers();
        } else {
          this.notificationService.error('Error', 'Failed to assign claim');
        }
        this.closeClaimAssignmentModal();
      },
      error: (error) => {
        console.error('Error assigning claim:', error);
        const errorMessage = error.error?.error || 'Failed to assign claim';
        this.notificationService.error('Error', errorMessage);
        this.closeClaimAssignmentModal();
      }
    });
  }

  closePolicyAssignmentModal(): void {
    this.showPolicyAssignmentModal = false;
    this.selectedUserForAssignment = null;
    this.selectedPolicyId = '';
    this.availablePolicies = [];
  }

  closeClaimAssignmentModal(): void {
    this.showClaimAssignmentModal = false;
    this.selectedUserForAssignment = null;
    this.selectedClaimId = '';
    this.availableClaims = [];
  }



  addUser(): void {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.password || !this.newUser.role) {
      this.notificationService.error('Error', 'Please fill in all required fields');
      return;
    }

    this.httpService.post('/admin/users', this.newUser).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notificationService.success('Success', `${this.newUser.role} created successfully!`);
          this.loadUsers();
          this.cancelAdd();
        } else {
          this.notificationService.error('Error', 'Failed to create user');
        }
      },
      error: (error) => {
        console.error('Error creating user:', error);
        const errorMessage = error.error?.error || 'Failed to create user';
        this.notificationService.error('Error', errorMessage);
      }
    });
  }

  cancelAdd(): void {
    this.showAddForm = false;
    this.newUser = {};
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.pagination.page = 1;
    this.loadUsers();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination.pages) {
      this.pagination.page = page;
      this.loadUsers();
    }
  }

  editUser(user: User): void {
    this.editingUser = { ...user };
    this.userUpdate = {
      name: user.name,
      email: user.email,
      role: user.role
    };
    this.showEditForm = true;
  }

  updateUser(): void {
    if (!this.editingUser) return;

    this.httpService.put(`/admin/users/${this.editingUser._id}`, this.userUpdate).subscribe({
      next: (response: any) => {
        this.loadUsers();
        this.cancelEdit();
        this.notificationService.success(
          'User Updated',
          `User "${this.userUpdate.name}" has been updated successfully`
        );
      },
      error: (error) => {
        console.error('Error updating user:', error);
        
        let errorMessage = 'Failed to update user';
        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.status === 400) {
          errorMessage = 'Invalid user data. Please check your inputs.';
        } else if (error.status === 404) {
          errorMessage = 'User not found.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        this.notificationService.error(
          'User Update Failed',
          errorMessage
        );
      }
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      this.httpService.delete(`/admin/users/${user._id}`).subscribe({
        next: () => {
          this.loadUsers();
          this.notificationService.success(
            'User Deleted',
            `User "${user.name}" has been deleted successfully`
          );
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          
          let errorMessage = 'Failed to delete user';
          if (error.error && error.error.error) {
            errorMessage = error.error.error;
          } else if (error.status === 400) {
            errorMessage = 'Cannot delete user with active policies or claims.';
          } else if (error.status === 404) {
            errorMessage = 'User not found.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          
          this.notificationService.error(
            'User Deletion Failed',
            errorMessage
          );
        }
      });
    }
  }

  cancelEdit(): void {
    this.editingUser = null;
    this.showEditForm = false;
    this.userUpdate = {};
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

  canDeleteUser(user: User): boolean {
    // Don't allow deleting admin users or the current user
    return user.role !== 'admin';
  }

  getTotalPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const start = Math.max(1, this.pagination.page - Math.floor(maxVisible / 2));
    const end = Math.min(this.pagination.pages, start + maxVisible - 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
