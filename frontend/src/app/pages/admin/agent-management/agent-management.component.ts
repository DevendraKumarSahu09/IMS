import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../store';
import { selectUser } from '../../../store/auth/auth.selectors';
import { HttpService } from '../../../services/http.service';
import { NotificationService } from '../../../shared/services/notification.service';

interface Agent {
  _id: string;
  name: string;
  email: string;
  role: string;
  assignedClaims?: number;
  createdAt: string;
}

interface Claim {
  _id: string;
  description: string;
  amountClaimed: number;
  status: string;
  createdAt: string;
  userId: any;
  userPolicyId: any;
}

interface CreateAgentRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

@Component({
  selector: 'app-agent-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './agent-management.component.html',
  styleUrl: './agent-management.component.css'
})
export class AgentManagementComponent implements OnInit {
  user$: Observable<any>;
  agents: Agent[] = [];
  loading = true;
  error: string | null = null;
  showCreateForm = false;
  newAgent: CreateAgentRequest = {
    name: '',
    email: '',
    password: '',
    role: 'agent'
  };

  // Claim assignment modal
  showClaimAssignmentModal = false;
  selectedAgentForClaim: Agent | null = null;
  availableClaims: Claim[] = [];
  selectedClaimId = '';

  constructor(
    private store: Store<AppState>,
    private httpService: HttpService,
    private notificationService: NotificationService
  ) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.loading = true;
    this.error = null;

    this.httpService.get('/admin/users').subscribe({
      next: (response: any) => {
        if (response.success) {
          // Filter to show only agents and admins
          this.agents = (response.data || []).filter((user: any) => 
            user.role === 'agent' || user.role === 'admin'
          ).map((agent: any) => ({
            ...agent,
            assignedClaims: agent.assignedClaims || 0
          }));
        } else {
          this.agents = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading agents:', error);
        this.error = 'Failed to load agents';
        this.loading = false;
      }
    });
  }

  createAgent(agentForm: any): void {
    console.log('Form data:', this.newAgent);
    console.log('Form valid:', agentForm.valid);
    console.log('Form touched:', agentForm.touched);
    console.log('Name:', this.newAgent.name, 'Email:', this.newAgent.email, 'Password:', this.newAgent.password);
    
    // Check if form is valid
    if (!agentForm.valid) {
      this.notificationService.error('Error', 'Please fill in all required fields correctly');
      return;
    }
    
    if (!this.newAgent.name || !this.newAgent.email || !this.newAgent.password) {
      const missingFields = [];
      if (!this.newAgent.name) missingFields.push('Name');
      if (!this.newAgent.email) missingFields.push('Email');
      if (!this.newAgent.password) missingFields.push('Password');
      this.notificationService.error('Error', `Please fill in all required fields. Missing: ${missingFields.join(', ')}`);
      return;
    }

    this.httpService.post('/admin/users', this.newAgent).subscribe({
      next: (response: any) => {
        if (response.success) {
          const roleCreated = this.newAgent.role;
          this.loadAgents();
          this.showCreateForm = false;
          this.newAgent = { name: '', email: '', password: '', role: 'agent' };
          this.notificationService.success('Success', `${roleCreated === 'admin' ? 'Admin' : 'Agent'} created successfully! They can now login with their credentials.`);
        } else {
          this.notificationService.error('Error', `Failed to create ${this.newAgent.role}`);
        }
      },
      error: (error) => {
        console.error('Error creating agent:', error);
        const errorMessage = error.error?.error || 'Failed to create agent';
        if (errorMessage.includes('already exists')) {
          this.notificationService.error('Error', 'A user with this email already exists. Please use a different email or ask them to login with their existing credentials.');
        } else {
          this.notificationService.error('Error', `Failed to create ${this.newAgent.role}: ${errorMessage}`);
        }
      }
    });
  }

  assignClaim(agent: Agent): void {
    this.selectedAgentForClaim = agent;
    this.selectedClaimId = '';
    this.loadPendingClaims();
    this.showClaimAssignmentModal = true;
  }

  loadPendingClaims(): void {
    this.httpService.get('/admin/claims/unassigned').subscribe({
      next: (response: any) => {
        if (response.success) {
          this.availableClaims = response.data || [];
        } else {
          this.availableClaims = [];
        }
      },
      error: (error) => {
        console.error('Error loading pending claims:', error);
        this.availableClaims = [];
        this.notificationService.error('Error', 'Failed to load pending claims');
      }
    });
  }

  assignSelectedClaim(): void {
    if (!this.selectedClaimId || !this.selectedAgentForClaim) {
      this.notificationService.error('Error', 'Please select a claim');
      return;
    }

    this.httpService.post('/admin/claims/assign', {
      claimId: this.selectedClaimId,
      agentId: this.selectedAgentForClaim._id
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notificationService.success('Success', 'Claim assigned successfully!');
          this.loadAgents();
          this.closeClaimAssignmentModal();
        } else {
          this.notificationService.error('Error', 'Failed to assign claim');
        }
      },
      error: (error) => {
        console.error('Error assigning claim:', error);
        const errorMessage = error.error?.error || 'Failed to assign claim';
        this.notificationService.error('Error', errorMessage);
        this.closeClaimAssignmentModal();
      }
    });
  }

  closeClaimAssignmentModal(): void {
    this.showClaimAssignmentModal = false;
    this.selectedAgentForClaim = null;
    this.selectedClaimId = '';
    this.availableClaims = [];
  }


  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'badge-success';
      case 'inactive': return 'badge-error';
      default: return 'badge-neutral';
    }
  }
}
