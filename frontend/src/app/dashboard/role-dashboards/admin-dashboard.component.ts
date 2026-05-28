import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseRoleDashboardComponent } from './base-role-dashboard';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['../dashboard.component.css']
})
export class AdminDashboardComponent extends BaseRoleDashboardComponent {}
