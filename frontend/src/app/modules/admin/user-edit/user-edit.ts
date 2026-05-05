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
    selectedGroupIds: number[] = [];
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
        this.loadUser();
    }

    loadGroups(): void {
        this.api.get('/groups/').subscribe({
            next: (data: any) => {
                this.allGroups = data.results || data || [];
                // Standardize on both nom and name for compatibility
                this.allGroups = this.allGroups.map(g => ({ ...g, nom: g.name || g.nom }));
                this.cd.markForCheck();
            },
            error: (err) => {
                console.error('Erreur chargement roles', err);
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
                // Use groups_detail if available, or fallback to groups (which may be IDs or names)
                if (Array.isArray(user.groups_detail)) {
                    this.selectedGroupIds = user.groups_detail.map((g: any) => g.id);
                } else if (Array.isArray(user.groups)) {
                    this.selectedGroupIds = user.groups.map((g: any) => {
                        if (typeof g === 'number') return g;
                        if (typeof g === 'string') {
                            const found = this.allGroups.find(ag => (ag.nom || ag.name) === g);
                            return found ? found.id : null;
                        }
                        return g.id;
                    }).filter((id: any) => id !== null);
                } else {
                    this.selectedGroupIds = [];
                }

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

    onStatusChange(event: any): void {
        const newStatus = event.target.checked;
        const action = newStatus ? 'activer' : 'désactiver';
        const actionColor = newStatus ? '#5a8dee' : '#ff5b5c';
        
        // Prevent default browser behavior to handle it with Swal
        event.preventDefault();

        (window as any).Swal.fire({
            title: 'Confirmer le changement ?',
            text: `Voulez-vous vraiment ${action} ce compte utilisateur ?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: actionColor,
            cancelButtonColor: '#828d99',
            confirmButtonText: `Oui, ${action} !`,
            cancelButtonText: 'Annuler',
            reverseButtons: true
        }).then((result: any) => {
            if (result.isConfirmed) {
                this.userData.is_active = newStatus;
                this.cd.markForCheck();
            } else {
                // Keep the previous status
                this.userData.is_active = !newStatus;
                this.cd.markForCheck();
            }
        });
    }

    deleteUser(): void {
        (window as any).Swal.fire({
            title: 'Êtes-vous sûr ?',
            text: 'Cette action supprimera définitivement l\'utilisateur. Cette opération est irréversible !',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff5b5c',
            cancelButtonColor: '#828d99',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler',
            reverseButtons: true
        }).then((result: any) => {
            if (result.isConfirmed) {
                this.api.delete(`/users/${this.userId}/`).subscribe({
                    next: () => {
                        (window as any).Swal.fire({
                            title: 'Supprimé !',
                            text: 'L\'utilisateur a été supprimé avec succès.',
                            icon: 'success',
                            confirmButtonColor: '#5a8dee'
                        }).then(() => {
                            this.router.navigate(['/admin/users']);
                        });
                    },
                    error: (err) => {
                        console.error('Erreur suppression', err);
                        (window as any).Swal.fire({
                            title: 'Erreur',
                            text: 'Une erreur est survenue lors de la suppression.',
                            icon: 'error',
                            confirmButtonColor: '#5a8dee'
                        });
                    }
                });
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
            groups: this.selectedGroupIds
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
