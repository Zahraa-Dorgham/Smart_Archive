import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  standalone: true
})
export class Header implements OnInit, OnDestroy {
  loginDate: Date | null = null;
  userName = 'Guest';
  userRoles = '';
  private sub?: Subscription;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    const ld = localStorage.getItem('login_date');
    this.loginDate = ld ? new Date(ld) : null;
    this.sub = this.authService.currentUser$.subscribe((user: any) => {
      if (user) {
        this.userName = user.first_name ? `${user.first_name} ${user.last_name}`.trim() : (user.username || 'Guest');
        let roles: any = user.roles || user.groups || [];
        if (Array.isArray(roles)) {
          this.userRoles = roles.map((r: any) => typeof r === 'object' ? r.name : r).join(', ');
        } else {
          this.userRoles = roles;
        }
      } else {
        this.userName = 'Guest';
        this.userRoles = '';
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
  }
}
