import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseRoleDashboardComponent } from './base-role-dashboard';

@Component({
  selector: 'app-responsable-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './responsable-dashboard.component.html',
  styleUrls: ['../dashboard.component.css']
})
export class ResponsableDashboardComponent extends BaseRoleDashboardComponent {}
