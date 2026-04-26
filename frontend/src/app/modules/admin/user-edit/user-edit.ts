import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-user-edit',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './user-edit.html',
    styleUrls: ['./user-edit.css']
})
export class UserEditComponent implements OnInit {
    userId: number | null = null;
    userData: any = {
        first_name: '',
        last_name: '',
        email: '',
        is_active: true,
        password: ''
    };
    allGroups: any[] = [];
    allPermissions: any[] = [];
    selectedGroupIds: number[] = [];
    selectedPermissionIds: number[] = [];
    submitting = false;
    loading = true;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private api: ApiService,
        private cd: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        this.userId = idParam ? +idParam : null;
        if (!this.userId) {
            this.router.navigate(['/admin/users']);
            return;
        }

        this.loadGroups();
        this.loadPermissions();
        this.loadUser();
    }

    loadGroups(): void {
        this.api.get('/roles/').subscribe({
            next: (data: any) => {
                this.allGroups = data.results || data || [];
                this.cd.markForCheck();
            },
            error: (err) => {
                console.error('Erreur chargement roles', err);
                this.cd.markForCheck();
            }
        });
    }

    loadPermissions(): void {
        this.api.get('/permissions/').subscribe({
            next: (data: any) => {
                this.allPermissions = data.results || data || [];
                this.cd.markForCheck();
            },
            error: (err) => {
                console.error('Erreur chargement permissions', err);
                this.cd.markForCheck();
            }
        });
    }

    loadUser(): void {
        this.api.get(`/users/${this.userId}/`).subscribe({
            next: (user: any) => {
                this.userData = {
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    email: user.email || '',
                    is_active: user.is_active === true,
                    password: ''
                };
                this.selectedGroupIds = Array.isArray(user.groups)
                    ? user.groups.map((group: any) => group.id)
                    : [];
                this.selectedPermissionIds = Array.isArray(user.direct_permissions)
                    ? user.direct_permissions.map((permission: any) => permission.id)
                    : [];
                this.loading = false;
                this.cd.markForCheck();
            },
            error: (err) => {
                console.error('Erreur chargement utilisateur', err);
                this.loading = false;
                this.cd.markForCheck();
            }
        });
    }

    onSubmit(): void {
        if (!this.userData.first_name || !this.userData.last_name || !this.userData.email) {
            alert('Veuillez remplir les champs obligatoires');
            return;
        }

        this.submitting = true;
        const payload: any = {
            username: this.userData.email,
            email: this.userData.email,
            first_name: this.userData.first_name,
            last_name: this.userData.last_name,
            is_active: this.userData.is_active,
            groups: this.selectedGroupIds,
            user_permissions: this.selectedPermissionIds
        };

        if (this.userData.password) {
            payload.password = this.userData.password;
        }

        this.api.put(`/users/${this.userId}/`, payload).subscribe({
            next: () => {
                this.submitting = false;
                this.router.navigate(['/admin/users']);
            },
            error: (err) => {
                this.submitting = false;
                console.error('Erreur modification', err);
                alert('Erreur lors de la modification');
            }
        });
    }

    cancel(): void {
        this.router.navigate(['/admin/users']);
    }
}
