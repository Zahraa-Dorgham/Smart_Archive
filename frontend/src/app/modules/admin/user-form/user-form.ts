// user-form.component.ts
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
    username: '',
    email: '',
    password: '',
    groups: []
  };
  allGroups: any[] = [];           // Liste de tous les groupes disponibles
  selectedGroupIds: number[] = []; // IDs des groupes sélectionnés

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) { }

  ngOnInit() {
    // Récupérer l'ID dans l'URL si présent
    const idParam = this.route.snapshot.paramMap.get('id');
    this.userId = idParam ? +idParam : null;
    this.isEditMode = !!this.userId;

    this.loadGroups();
    if (this.isEditMode) {
      this.loadUser();
    }
  }

  loadGroups() {
    this.api.get('/groups/').subscribe({
      next: (data: any) => {
        // Si l'API renvoie une structure paginée
        this.allGroups = data.results || data;
        console.log('Groupes chargés :', this.allGroups); // pour vérifier
      },
      error: (err) => console.error('Erreur chargement groupes', err)
    });
  }

  loadUser() {
    this.api.get(`/users/${this.userId}/`).subscribe({
      next: (data: any) => {
        this.user = data;
        // Extraire les IDs des groupes (selon le format renvoyé par votre API)
        if (data.groups && Array.isArray(data.groups)) {
          this.selectedGroupIds = data.groups.map((g: any) => g.id || g);
        }
      },
      error: (err) => console.error('Erreur chargement utilisateur', err)
    });
  }

  save() {
    // Construire le payload pour l'API
    const payload: any = {
      username: this.user.username,
      email: this.user.email,
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

  cancel() {
    this.router.navigate(['/admin/users']);
  }
}