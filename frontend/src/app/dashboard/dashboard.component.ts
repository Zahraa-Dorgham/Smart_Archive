import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user$: any;
  loginDate: Date | null = null;
  stats = { documents: 124, dossiers: 56, archives: 12 };

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.user$ = this.authService.currentUser$;
    const ld = localStorage.getItem('login_date');
    this.loginDate = ld ? new Date(ld) : null;
  }

  get userName(): string {
    const u = this.authService.getCurrentUser();
    if (!u) return 'User';
    return u.first_name ? `${u.first_name} ${u.last_name}`.trim() : (u.username || 'User');
  }

  get userRoles(): string[] {
    return this.authService.getUserRoles();
  }
}
