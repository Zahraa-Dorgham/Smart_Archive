import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatIconModule, MatFormFieldModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css']
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm = '';
  page = 1;
  pageSize = 5;
  totalPages = 1;

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.api.get('/users/').subscribe({
      next: (data: any) => {
        this.users = data.results || data;
        this.applyFilter();
      },
      error: (err) => console.error('Erreur chargement utilisateurs', err)
    });
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.username.toLowerCase().includes(term) ||
      (user.email && user.email.toLowerCase().includes(term))
    );
    this.page = 1;
    this.updateTotalPages();
  }

  updateTotalPages() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    if (this.totalPages === 0) this.totalPages = 1;
  }

  onPageSizeChange() {
    this.page = 1;
    this.updateTotalPages();
  }

  previousPage() {
    if (this.page > 1) this.page--;
  }

  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }

  openCreate() {
    this.router.navigate(['/admin/users/new']);
  }

  edit(user: any) {
    this.router.navigate([`/admin/users/${user.id}/edit`]);
  }

  delete(id: number) {
    if (confirm('Supprimer cet utilisateur ?')) {
      this.api.delete(`/users/${id}/`).subscribe(() => this.loadUsers());
    }
  }
}