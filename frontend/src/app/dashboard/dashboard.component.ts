import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';

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
  globalStats: any = {
    total_documents: 0,
    total_dossiers: 0,
    total_boitiers: 0,
    total_batiments: 0,
    total_users: 0,
    active_users: 0
  };
  batimentStats: any[] = [];
  loading = true;

  constructor(
    public authService: AuthService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.user$ = this.authService.currentUser$;
    const ld = localStorage.getItem('login_date');
    this.loginDate = ld ? new Date(ld) : null;
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.api.get('/stats/').subscribe({
      next: (res: any) => {
        this.globalStats = res.global || this.globalStats;
        this.batimentStats = res.batiments || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading stats', err);
        this.loading = false;
      }
    });
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
