import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout-authentifie.html',
  styleUrls: ['./layout-authentifie.css']
})
export class LayoutComponent {
  constructor(public authService: AuthService, private router: Router) { }

  logout(): void {
    // Exemple avec token JWT
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }
}