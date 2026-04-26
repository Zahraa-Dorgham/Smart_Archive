import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';

declare var bootstrap: any;

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

  userData = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    is_active: true,
    role_id: null as number | null,
  };

  roles: any[] = [];
  allPermissions: any[] = [];
  selectedPermissionId: number | null = null;
  customPermissions: any[] = [];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles(): void {
    this.api.get('/roles/').subscribe({
      next: (data: any) => {
        this.roles = data.results || data || [];
      },
      error: (err) => console.error('Erreur chargement roles', err)
    });
  }

  loadPermissions(): void {
    this.api.get('/permissions/').subscribe({
      next: (data: any) => {
        this.allPermissions = data.results || data || [];
      },
      error: (err) => console.error('Erreur chargement permissions', err)
    });
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= 3) {
      this.currentStep = step;
    }
  }

  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  addPermission(): void {
    if (!this.selectedPermissionId) {
      return;
    }

    const permission = this.allPermissions.find((item) => item.id === Number(this.selectedPermissionId));
    if (!permission) {
      return;
    }

    const alreadySelected = this.customPermissions.some((item) => item.id === permission.id);
    if (!alreadySelected) {
      this.customPermissions = [...this.customPermissions, permission];
    }

    this.selectedPermissionId = null;
  }

  removePermission(index: number): void {
    this.customPermissions.splice(index, 1);
    this.customPermissions = [...this.customPermissions];
  }

  preview(): void {
    const modalElement = document.getElementById('previewModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  onSubmit(): void {
    if (!this.userData.first_name || !this.userData.last_name || !this.userData.email || !this.userData.password) {
      alert('Veuillez remplir les champs obligatoires');
      this.currentStep = 1;
      return;
    }

    if (!this.userData.role_id) {
      alert('Veuillez selectionner un role');
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
      user_permissions: this.customPermissions.map((permission) => permission.id),
      password: this.userData.password
    };

    this.api.post('/users/', payload).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        this.submitting = false;
        console.error('Erreur creation utilisateur', err);
        alert('Erreur lors de la creation de l utilisateur');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }
}
