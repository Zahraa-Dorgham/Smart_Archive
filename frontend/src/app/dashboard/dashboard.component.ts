import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page">
      <h1>Dashboard</h1>
      <p class="welcome">
        Welcome back, <strong>{{ userName }}</strong>!
      </p>
      <p>Your role(s): <strong>{{ userRoles.join(', ') || 'N/A' }}</strong></p>

      <div class="dashboard-actions">
        <h2>Quick links</h2>
        <div class="links">
          <a routerLink="/dashboard" class="button current">Dashboard</a>
          <a *ngIf="authService.hasRole('Administrateur')" routerLink="/admin/users" class="button">Admin users</a>
          <a *ngIf="authService.hasRole('Archiviste')" routerLink="/archiviste/batiments" class="button">Archives</a>
          <a *ngIf="authService.hasRole('Responsable')" routerLink="/responsable/transferts" class="button">Transfers</a>
          <a *ngIf="authService.hasRole('Employé')" routerLink="/employe/recherche" class="button">Research</a>
        </div>
      </div>
    </div>
  `,
  styles: [
    ".dashboard-page { padding: 24px; }",
    ".dashboard-actions { margin-top: 24px; }",
    ".links { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }",
    ".button { display: inline-flex; align-items: center; justify-content: center; padding: 12px 16px; color: #fff; background: #3f51b5; border-radius: 8px; text-decoration: none; }",
    ".button.current { background: #283593; }",
    ".welcome { margin: 8px 0 0; }"
  ]
})
export class DashboardComponent {
  constructor(public authService: AuthService) {}

  get userName(): string {
    return this.authService.getCurrentUser()?.first_name || this.authService.getCurrentUser()?.username || 'User';
  }

  get userRoles(): string[] {
    return this.authService.getUserRoles();
  }
}
