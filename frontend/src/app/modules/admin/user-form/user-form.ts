import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

// Déclaration de Bootstrap (pour le modal)
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
    phone: '',
    address: '',
    password: '',
    is_active: true,
    role_id: null as number | null,
    must_have_info: ''
  };

  roles: any[] = [];          // Liste des rôles (groups) depuis l'API
  customPermissions: { module: string; subject: string; action: string }[] = [];
  newPermission = { module: '', subject: '', action: '' };

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.api.get('/groups/').subscribe({
      next: (data: any) => {
        this.roles = data.results || data;
      },
      error: (err) => console.error('Erreur chargement rôles', err)
    });
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= 3) {
      this.currentStep = step;
    }
  }

  nextStep(): void {
    if (this.currentStep < 3) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  addPermission(): void {
    if (this.newPermission.module && this.newPermission.subject && this.newPermission.action) {
      this.customPermissions.push({ ...this.newPermission });
      this.newPermission = { module: '', subject: '', action: '' };
    } else {
      alert('Please fill all fields (Module, Subject, Action) before adding a permission.');
    }
  }

  removePermission(index: number): void {
    this.customPermissions.splice(index, 1);
  }

  addOtherPermission(): void {
    // Option: could open a separate form or just scroll to the add section
    // For simplicity, we just focus on the first input
    const firstInput = document.querySelector('.row.g-2 input');
    if (firstInput) (firstInput as HTMLElement).focus();
  }

  getRoleName(roleId: number | null): string {
    if (!roleId) return '';
    const role = this.roles.find(r => r.id === roleId);
    return role ? role.name : '';
  }

  preview(): void {
    const modalElement = document.getElementById('previewModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  onSubmit(): void {
    // Validation
    if (!this.userData.first_name || !this.userData.last_name || !this.userData.email || !this.userData.password) {
      alert('Please fill required fields: First Name, Last Name, Email, Password');
      this.currentStep = 1;
      return;
    }
    if (!this.userData.role_id) {
      alert('Please select a role');
      this.currentStep = 2;
      return;
    }

    this.submitting = true;
    const payload: any = {
      username: this.userData.email,
      email: this.userData.email,
      first_name: this.userData.first_name,
      last_name: this.userData.last_name,
      phone: this.userData.phone,
      address: this.userData.address,
      is_active: this.userData.is_active,
      groups: [this.userData.role_id],
      custom_permissions: this.customPermissions,
      must_have_info: this.userData.must_have_info,
      password: this.userData.password
    };

    this.api.post('/users/', payload).subscribe({
      next: () => {
        this.submitting = false;
        alert('User created successfully!');
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        this.submitting = false;
        console.error('Error creating user', err);
        alert('Error creating user. Please check the console for details.');
      }
    });
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? Any unsaved data will be lost.')) {
      this.router.navigate(['/admin/users']);
    }
  }
}