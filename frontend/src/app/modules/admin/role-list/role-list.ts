import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface RoleModulePermission {
  moduleName: string;
  count: number;
}

interface RoleData {
  id: number;
  nom: string;
  description: string;
  created_at: string;
  totalPermissions: number;
  modules: RoleModulePermission[];
  expanded?: boolean;
}

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe],
  templateUrl: './role-list.html',
  styleUrls: ['./role-list.css']
})
export class RoleListComponent implements OnInit {
  roles: RoleData[] = [];
  loading = false;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.api.get('/groups/').subscribe({
      next: (data: any) => {
        const results = data.results || data || [];
        
        this.roles = results.map((r: any) => ({
          id: r.id,
          nom: r.name || r.nom, // Django Group uses 'name'
          description: r.description || `Group ${r.name || r.nom} with default permissions.`,
          created_at: r.created_at || new Date().toISOString(), // Mocking date
          totalPermissions: r.permissions?.length || 20, // Mocked for now to match UI
          expanded: true,
          modules: [ // Mocked for now to match UI
            { moduleName: 'Boitiers', count: 5 },
            { moduleName: 'Documents', count: 5 },
            { moduleName: 'Dossiers', count: 5 },
            { moduleName: 'Roles', count: 5 }
          ]
        }));
        
        // Add implicit 'Employé' role if it doesn't exist in the DB
        const hasEmploye = this.roles.some(r => r.nom.toLowerCase() === 'employé' || r.nom.toLowerCase() === 'employe');
        if (!hasEmploye) {
            this.roles.push({
                id: 9999, // Dummy ID
                nom: 'Employé',
                description: 'Default role for basic users. Read-only access usually.',
                created_at: new Date().toISOString(),
                totalPermissions: 15,
                expanded: true,
                modules: [
                    { moduleName: 'Boitiers', count: 5 },
                    { moduleName: 'Documents', count: 5 },
                    { moduleName: 'Recherche', count: 5 }
                ]
            });
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur', err);
        this.loading = false;
      }
    });
  }

  openCreate(): void {
    this.router.navigate(['/admin/roles/new']);
  }

  edit(role: any): void {
    this.router.navigate([`/admin/roles/${role.id}/edit`]);
  }

  delete(id: number): void {
    (window as any).Swal.fire({
      title: 'Supprimer ce rôle ?',
      text: 'Les utilisateurs ayant ce rôle perdront les permissions associées.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff5b5c',
      cancelButtonColor: '#828d99',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler',
      reverseButtons: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.api.delete(`/groups/${id}/`).subscribe({
          next: () => {
            (window as any).Swal.fire({
              title: 'Supprimé !',
              text: 'Le rôle a été supprimé avec succès.',
              icon: 'success',
              confirmButtonColor: '#5a8dee'
            });
            this.loadRoles();
          },
          error: (err) => {
            console.error('Erreur', err);
            (window as any).Swal.fire({
              title: 'Erreur',
              text: 'Impossible de supprimer ce rôle.',
              icon: 'error',
              confirmButtonColor: '#5a8dee'
            });
          }
        });
      }
    });
  }

  toggleModuleExpand(role: RoleData): void {
      role.expanded = !role.expanded;
  }
}
