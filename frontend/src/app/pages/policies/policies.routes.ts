import { Routes } from '@angular/router';
import { PolicyListComponent } from './policy-list/policy-list.component';
import { PolicyDetailComponent } from './policy-detail/policy-detail.component';
import { MyPoliciesComponent } from './my-policies/my-policies.component';

export const policiesRoutes: Routes = [
  { path: '', component: PolicyListComponent },
  { path: 'my-policies', component: MyPoliciesComponent },
  { path: ':id', component: PolicyDetailComponent }
];
