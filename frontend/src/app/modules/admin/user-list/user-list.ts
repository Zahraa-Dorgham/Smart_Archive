import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css']
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  selectedUser: any = null;

  totalUsers = 0;
  activeUsers = 0;
  inactiveUsers = 0;
  totalRoles = 0;
  totalDepartments = 0;
  loadingUsers = false;

  searchTerm = '';
  page = 1;
  pageSize = 5;
  totalPages = 1;

  constructor(
    private api: ApiService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.selectedUser = null;

    this.api.get('/users/').subscribe({
      next: (data: any) => {
        const results = Array.isArray(data?.results) ? data.results : data;
        this.users = (results || []).map((user: any) => {
          const groups = Array.isArray(user.groups) ? user.groups : [];
          const roleNames = Array.isArray(user.roles)
            ? user.roles
            : groups.map((group: any) => group?.name).filter(Boolean);

          return {
            ...user,
            groups,
            roles: roleNames,
            role: user.primary_role || roleNames[0] || 'Employe',
            full_name: user.full_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username,
            role_permissions: Array.isArray(user.role_permissions) ? user.role_permissions : [],
            direct_permissions: Array.isArray(user.direct_permissions) ? user.direct_permissions : [],
          };
        });

        this.computeStats();
        this.applyFilter();
        this.loadingUsers = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs', err);
        this.loadingUsers = false;
      }
    });
  }

  computeStats(): void {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter((user) => user.is_active).length;
    this.inactiveUsers = this.totalUsers - this.activeUsers;
    this.totalRoles = new Set(this.users.flatMap((user) => user.roles || [])).size;
    this.totalDepartments = 0;
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredUsers = term
      ? this.users.filter((user) => {
          const haystack = [
            user.first_name,
            user.last_name,
            user.full_name,
            user.email,
            user.username,
            ...(user.roles || []),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return haystack.includes(term);
        })
      : [...this.users];

    this.page = 1;
    this.updateTotalPages();
    this.selectedUser = this.filteredUsers[0] || null;
  }

  updateTotalPages(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }

  get paginatedUsers(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.updateTotalPages();
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }

  selectUser(user: any): void {
    this.selectedUser = user;
  }

  openCreate(): void {
    this.router.navigate(['/admin/users/new']);
  }

  edit(user: any): void {
    this.router.navigate([`/admin/users/${user.id}/edit`]);
  }

  delete(id: number): void {
    if (!confirm('Supprimer définitivement cet utilisateur ?')) {
      return;
    }

    this.api.delete(`/users/${id}/`).subscribe({
      next: () => this.loadUsers(),
      error: (err) => console.error('Erreur suppression', err)
    });
  }

  trackByPermission(_: number, permission: any): string {
    return permission?.label || permission?.codename || permission?.name || String(_);
  }
}
