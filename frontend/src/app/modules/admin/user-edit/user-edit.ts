import { Component, OnInit } from '@angular/core';
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
        phone: '',
        address: '',
        is_active: true
    };
    allGroups: any[] = [];
    selectedGroupIds: number[] = [];
    submitting = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private api: ApiService
    ) { }

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        this.userId = idParam ? +idParam : null;
        if (!this.userId) {
            this.router.navigate(['/admin/users']);
            return;
        }
        this.loadGroups();
        this.loadUser();
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
            next: (user: any) => {
                this.userData = {
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    address: user.address || '',
                    is_active: user.is_active === true
                };
                // Récupération des IDs des groupes
                if (user.groups && Array.isArray(user.groups)) {
                    this.selectedGroupIds = user.groups.map((g: any) => g.id);
                }
            },
            error: (err) => console.error('Erreur chargement utilisateur', err)
        });
    }

    onSubmit(): void {
        if (!this.userData.first_name || !this.userData.last_name || !this.userData.email) {
            alert('Veuillez remplir les champs obligatoires (Prénom, Nom, Email)');
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
            groups: this.selectedGroupIds
        };

        this.api.put(`/users/${this.userId}/`, payload).subscribe({
            next: () => {
                this.submitting = false;
                alert('Utilisateur modifié avec succès !');
                this.router.navigate(['/admin/users']);
            },
            error: (err) => {
                this.submitting = false;
                console.error('Erreur modification', err);
                alert('Erreur lors de la modification.');
            }
        });
    }

    cancel(): void {
        this.router.navigate(['/admin/users']);
    }
}