import { Component, OnInit } from '@angular/core';
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
  customPermissions: string[] = ['read InventoryItem'];

  totalUsers = 0;
  activeUsers = 0;
  inactiveUsers = 0;
  totalRoles = 0;
  totalDepartments = 0;

  searchTerm = '';
  page = 1;
  pageSize = 5;
  totalPages = 1;

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.api.get('/users/').subscribe({
      next: (data: any) => {
        const usersData = data.results || data;
        this.users = usersData.map((user: any) => {
          let groups = user.groups || [];
          if (groups.length > 0 && typeof groups[0] === 'object') {
            groups = groups.map((g: any) => g.name || g);
          }
          return {
            ...user,
            first_name: user.first_name || user.username || '?',
            last_name: user.last_name || '',
            department: user.department || '—',
            groups: groups,
            role: groups[0] || 'employee',
            is_active: user.is_active === true,
            phone: user.phone || '—',
            address: user.address || '—',
            created_at: user.created_at || user.date_joined || new Date(),
            updated_at: user.updated_at || user.last_login || new Date(),
            role_permissions: user.role_permissions || []
          };
        });
        console.log('Users chargés :', this.users); // Vérifie
        this.computeStats();
        this.applyFilter(); // ← important
      },
      error: (err) => console.error('Erreur chargement utilisateurs', err)
    });
  }

  computeStats(): void {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter(u => u.is_active).length;
    this.inactiveUsers = this.totalUsers - this.activeUsers;

    const rolesSet = new Set<string>();
    this.users.forEach(u => u.groups.forEach((g: string) => rolesSet.add(g)));
    this.totalRoles = rolesSet.size;

    const deptsSet = new Set(this.users.map(u => u.department).filter(d => d && d !== '—'));
    this.totalDepartments = deptsSet.size;
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredUsers = term ? this.users.filter(user => {
      return user.first_name.toLowerCase().includes(term) ||
             user.last_name.toLowerCase().includes(term) ||
             user.email.toLowerCase().includes(term) ||
             user.department.toLowerCase().includes(term) ||
             user.role.toLowerCase().includes(term);
    }) : [...this.users];
    this.page = 1;
    this.updateTotalPages();
    if (this.filteredUsers.length > 0) this.selectUser(this.filteredUsers[0]);
    else this.selectedUser = null;
  }
  updateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    if (this.totalPages === 0) this.totalPages = 1;
  }

  get paginatedUsers(): any[] {
    const start = (this.page - 1) * this.pageSize;
    const sliced = this.filteredUsers.slice(start, start + this.pageSize);
    console.log('paginatedUsers slice:', sliced);
    return sliced;
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.updateTotalPages();
  }

  previousPage(): void {
    if (this.page > 1) this.page--;
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.page++;
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
    if (confirm('Supprimer définitivement cet utilisateur ?')) {
      this.api.delete(`/users/${id}/`).subscribe({
        next: () => this.loadUsers(),
        error: (err) => console.error('Erreur suppression', err)
      });
    }
  }
}