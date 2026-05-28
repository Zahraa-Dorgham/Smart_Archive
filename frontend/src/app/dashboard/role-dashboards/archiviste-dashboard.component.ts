import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseRoleDashboardComponent } from './base-role-dashboard';

@Component({
  selector: 'app-archiviste-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archiviste-dashboard.component.html',
  styleUrls: ['../dashboard.component.css']
})
export class ArchivisteDashboardComponent extends BaseRoleDashboardComponent {}
