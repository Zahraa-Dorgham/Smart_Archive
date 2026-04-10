import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.css'] 
})
export class UserFormComponent implements OnInit {
  isEditMode = false;
  userId: number | null = null;
  user: any = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    department: '',
    is_active: true,
    password: ''
  };
  allGroups: any[] = [];
  selectedGroupIds: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.userId = idParam ? +idParam : null;
    this.isEditMode = !!this.userId;

    this.loadGroups();
    if (this.isEditMode) this.loadUser();
  }

  loadGroups(): void {
    this.api.get('/groups/').subscribe({
      next: (data: any) => {
        this.allGroups = data.results || data;
      },
      error: (err) => console.error('Erreur chargement groupes', err)
    });
  }

  loadUser(): void {
    this.api.get(`/users/${this.userId}/`).subscribe({
      next: (data: any) => {
        this.user = {
          ...data,
          password: '' // pas de mot de passe en modification
        };
        // Récupérer les IDs des groupes de l'utilisateur
        if (data.groups && Array.isArray(data.groups)) {
          this.selectedGroupIds = data.groups.map((g: any) => g.id);
        }
      },
      error: (err) => console.error('Erreur chargement utilisateur', err)
    });
  }

  save(): void {
    const payload: any = {
      username: this.user.email, // ou un champ username dédié si tu en as un
      email: this.user.email,
      first_name: this.user.first_name,
      last_name: this.user.last_name,
      phone: this.user.phone,
      address: this.user.address,
      department: this.user.department,
      is_active: this.user.is_active,
      groups: this.selectedGroupIds
    };
    if (!this.isEditMode) {
      payload.password = this.user.password;
    }

    const request = this.isEditMode
      ? this.api.put(`/users/${this.userId}/`, payload)
      : this.api.post('/users/', payload);

    request.subscribe({
      next: () => this.router.navigate(['/admin/users']),
      error: (err) => console.error('Erreur sauvegarde', err)
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }
}