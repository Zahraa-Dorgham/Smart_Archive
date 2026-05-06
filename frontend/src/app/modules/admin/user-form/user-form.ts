import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.css']
})
export class UserFormComponent implements OnInit {
  currentStep = 1;
  submitting = false;
  showPassword = false;

  userData = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    is_active: true,
    role_id: null as number | null,
  };

  roles: any[] = [];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  loadRoles(): void {
    this.api.get('/groups/').subscribe({
      next: (data: any) => {
        this.roles = data.results || data || [];
        // Ensure we have name field (Django Group uses 'name')
        this.roles = this.roles.map(r => ({ ...r, nom: r.name || r.nom }));
      },
      error: (err) => console.error('Erreur chargement roles', err)
    });
  }



  goToStep(step: number): void {
    if (step >= 1 && step <= 2) {
      this.currentStep = step;
    }
  }

  nextStep(): void {
    if (this.currentStep < 2) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onSubmit(): void {
    if (!this.userData.first_name || !this.userData.last_name || !this.userData.email || !this.userData.password) {
      (window as any).Swal.fire({
        title: 'Champs manquants',
        text: 'Veuillez remplir tous les champs obligatoires (Prénom, Nom, Email et Mot de passe).',
        icon: 'warning',
        confirmButtonColor: '#5a8dee'
      });
      this.currentStep = 1;
      return;
    }

    if (!this.userData.role_id) {
      (window as any).Swal.fire({
        title: 'Rôle requis',
        text: 'Veuillez sélectionner un rôle pour cet utilisateur.',
        icon: 'warning',
        confirmButtonColor: '#5a8dee'
      });
      this.currentStep = 2;
      return;
    }

    this.submitting = true;
    const payload = {
      username: this.userData.email,
      email: this.userData.email,
      first_name: this.userData.first_name,
      last_name: this.userData.last_name,
      is_active: this.userData.is_active,
      groups: [this.userData.role_id],
      password: this.userData.password
    };

    this.api.post('/users/', payload).subscribe({
      next: () => {
        this.submitting = false;
        (window as any).Swal.fire({
          title: 'Succès !',
          text: 'L\'utilisateur a été créé avec succès.',
          icon: 'success',
          confirmButtonColor: '#5a8dee'
        }).then(() => {
          this.router.navigate(['/admin/users']);
        });
      },
      error: (err) => {
        this.submitting = false;
        console.error('Erreur creation utilisateur', err);
        (window as any).Swal.fire({
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la création de l\'utilisateur. Vérifiez si l\'email est déjà utilisé.',
          icon: 'error',
          confirmButtonColor: '#5a8dee'
        });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }
}
