import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseRoleDashboardComponent } from './base-role-dashboard';

@Component({
  selector: 'app-employe-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employe-dashboard.component.html',
  styleUrls: ['../dashboard.component.css']
})
export class EmployeDashboardComponent extends BaseRoleDashboardComponent {}
