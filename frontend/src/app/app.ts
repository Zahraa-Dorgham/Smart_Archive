import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; // Ajout de RouterLinkActive
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive, // Requis pour tes liens de menu
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <mat-toolbar color="primary" class="app-toolbar" *ngIf="authService.isLoggedIn()">
      <span>Archive Manager</span>
      <span class="spacer"></span>
      <button mat-button (click)="logout()">
        <mat-icon>exit_to_app</mat-icon> Déconnexion
      </button>
    </mat-toolbar>

    <mat-sidenav-container class="main-container">
      <mat-sidenav #drawer mode="side" [opened]="authService.isLoggedIn()" *ngIf="authService.isLoggedIn()">
        <mat-nav-list>
          <a mat-list-item routerLink="/batiments" routerLinkActive="active">
            <mat-icon matListItemIcon>business</mat-icon>
            <span matListItemTitle>Bâtiments</span>
          </a>
          <a mat-list-item routerLink="/salles" routerLinkActive="active">
            <mat-icon matListItemIcon>meeting_room</mat-icon>
            <span matListItemTitle>Salles</span>
          </a>
          <a mat-list-item routerLink="/armoires" routerLinkActive="active">
            <mat-icon matListItemIcon>cabinet</mat-icon>
            <span matListItemTitle>Armoires</span>
          </a>
          <a mat-list-item routerLink="/etageres" routerLinkActive="active">
            <mat-icon matListItemIcon>shelves</mat-icon>
            <span matListItemTitle>Étagères</span>
          </a>

            <a mat-list-item routerLink="/phases" routerLinkActive="active">
                <mat-icon matListItemIcon>timeline</mat-icon>
                <span matListItemTitle>Calendrier</span>
            </a>
            <a mat-list-item routerLink="/boitiers" routerLinkActive="active">
                <mat-icon matListItemIcon>inventory</mat-icon>
                <span matListItemTitle>Boîtiers</span>
            </a>
            <a mat-list-item routerLink="/dossiers" routerLinkActive="active">
                <mat-icon matListItemIcon>folder</mat-icon>
                <span matListItemTitle>Dossiers</span>
            </a>
            <a mat-list-item routerLink="/documents" routerLinkActive="active">
                <mat-icon matListItemIcon>description</mat-icon>
                <span matListItemTitle>Documents</span>
            </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .spacer { flex: 1 1 auto; }
    .main-container { height: 100vh; }
    .content { padding: 20px; }
    .active { background: rgba(0,0,0,0.04); }
  `]
})
export class AppComponent {
  constructor(public authService: AuthService) { }

  logout(): void {
    this.authService.logout();
    // Utiliser window.location est radical, mais efficace pour vider l'état
    window.location.href = '/login'; 
  }
}