import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatPaginatorModule, MatSortModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css']
})
export class UserListComponent implements OnInit {
  dataSource = new MatTableDataSource<any>([]);
  
  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.dataSource.paginator = mp;
  }
  
  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.dataSource.sort = ms;
  }

  users: any[] = [];
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
          
          // Aggregate unique role names from groups_detail, groups (if strings), and roles field
          const roleNames = Array.from(new Set([
            ...(Array.isArray(user.groups_detail) ? user.groups_detail.map((g: any) => g.name || g.nom) : []),
            ...(Array.isArray(user.groups) ? user.groups.filter((g: any) => typeof g === 'string') : []),
            ...(Array.isArray(user.roles) ? user.roles : [])
          ])).filter(Boolean);

          const firstName = user.first_name || '';
          const lastName = user.last_name || '';
          const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.username.substring(0, 2).toUpperCase();

          return {
            ...user,
            groups,
            roles: roleNames,
            initials: initials,
            full_name: user.full_name || [firstName, lastName].filter(Boolean).join(' ') || user.username,
            role_permissions: Array.isArray(user.role_permissions) ? user.role_permissions : [],
            direct_permissions: Array.isArray(user.direct_permissions) ? user.direct_permissions : [],
          };
        });

        this.computeStats();
        this.dataSource.data = this.users;
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

  getRoleBadgeClass(roleName: string): string {
    const name = (roleName || '').toLowerCase();
    if (name.includes('admin')) return 'badge-light-danger';
    if (name.includes('archiviste')) return 'badge-light-primary';
    if (name.includes('responsable')) return 'badge-light-warning';
    if (name.includes('employe') || name.includes('employé')) return 'badge-light-info';
    return 'badge-light-secondary';
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
    this.dataSource.filter = term;
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    
    // Update selected user based on filtered results
    const filteredData = this.dataSource.filteredData;
    if (filteredData.length > 0) {
        this.selectedUser = filteredData[0];
    } else {
        this.selectedUser = null;
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
    (window as any).Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Voulez-vous vraiment supprimer définitivement cet utilisateur ? Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff5b5c',
      cancelButtonColor: '#828d99',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler',
      reverseButtons: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.api.delete(`/users/${id}/`).subscribe({
          next: () => {
            (window as any).Swal.fire({
              title: 'Supprimé !',
              text: 'L\'utilisateur a été supprimé.',
              icon: 'success',
              confirmButtonColor: '#5a8dee'
            });
            this.loadUsers();
          },
          error: (err) => {
            console.error('Erreur suppression', err);
            (window as any).Swal.fire({
              title: 'Erreur',
              text: 'Impossible de supprimer cet utilisateur.',
              icon: 'error',
              confirmButtonColor: '#5a8dee'
            });
          }
        });
      }
    });
  }

  trackByPermission(_: number, permission: any): string {
    return permission?.label || permission?.codename || permission?.name || String(_);
  }
}
