import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { dashboardRedirectGuard, roleGuard } from './core/guards/role.guard';
import { LayoutPublicComponent } from './layout/layout-public/layout-public';
import { LayoutComponent } from './layout/layout-authentifie/layout-authentifie';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutPublicComponent,
    children: [
      { path: '', component: LoginComponent },
      { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) }
    ]
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        canActivate: [() => roleGuard(['Admin', 'Administrateur'])()],
        children: [
          { path: 'users', loadComponent: () => import('./modules/admin/user-list/user-list').then(m => m.UserListComponent) },
          { path: 'users/new', loadComponent: () => import('./modules/admin/user-form/user-form').then(m => m.UserFormComponent) },
          { path: 'users/:id/edit', loadComponent: () => import('./modules/admin/user-edit/user-edit').then(m => m.UserEditComponent) },
          { path: 'roles', loadComponent: () => import('./modules/admin/role-list/role-list').then(m => m.RoleListComponent) },
          { path: 'roles/new', loadComponent: () => import('./modules/admin/role-form/role-form').then(m => m.RoleFormComponent) },
          { path: 'roles/:id/edit', loadComponent: () => import('./modules/admin/role-form/role-form').then(m => m.RoleFormComponent) },
          { path: '', redirectTo: 'users', pathMatch: 'full' }
        ]
      },
      {
        path: 'dashboard',
        canActivate: [dashboardRedirectGuard],
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { dashboardRole: 'admin' }
      },
      {
        path: 'archiviste',
        canActivate: [() => roleGuard(['Archiviste', 'Admin', 'Administrateur'])()],
        children: [
          { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent), data: { dashboardRole: 'archiviste' } },
          { path: 'batiments', loadComponent: () => import('./batiment/show-batiment/show-batiment').then(m => m.ShowBatimentComponent) },
          // Calendrier module (new)
          { path: 'calendrier', loadComponent: () => import('./calendrier/show-calendrier/show-calendrier').then(m => m.ShowCalendrierComponent) },
          // Legacy 'phases' route also points to the Calendrier component
          { path: 'phases', loadComponent: () => import('./calendrier/show-calendrier/show-calendrier').then(m => m.ShowCalendrierComponent) },
          { path: 'directions', loadComponent: () => import('./direction/show-direction/show-direction').then(m => m.ShowDirectionComponent) },
          { path: 'salles', loadComponent: () => import('./salles/show-salle/show-salle').then(m => m.ShowSalleComponent) },
          { path: 'armoires', loadComponent: () => import('./armoires/show-armoire/show-armoire').then(m => m.ShowArmoireComponent) },
          { path: 'etageres', loadComponent: () => import('./etageres/show-etagere/show-etagere').then(m => m.ShowEtagereComponent) },
          { path: 'boitiers', loadComponent: () => import('./boitiers/show-boitier/show-boitier').then(m => m.ShowBoitierComponent) },
          { path: 'dossiers', loadComponent: () => import('./dossiers/show-dossier/show-dossier').then(m => m.ShowDossierComponent) },
          { path: 'documents', loadComponent: () => import('./documents/show-doc/show-doc').then(m => m.ShowDocumentComponent) },
          { path: 'transferts', loadComponent: () => import('./transferts/show-transfert/show-transfert').then(m => m.ShowTransfertComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
      },
      {
        path: 'responsable',
        canActivate: [() => roleGuard(['Responsable', 'Archiviste', 'Admin', 'Administrateur'])()],
        children: [
          { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent), data: { dashboardRole: 'responsable' } },
          { path: 'transferts', loadComponent: () => import('./transferts/show-transfert/show-transfert').then(m => m.ShowTransfertComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
      },
      {
        path: 'employe',
        canActivate: [() => roleGuard(['Employe', 'Employé'])()],
        children: [
          { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent), data: { dashboardRole: 'employe' } },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
      },
      { path: 'batiments', redirectTo: '/archiviste/batiments' },
      { path: 'salles', redirectTo: '/archiviste/salles' },
      { path: 'armoires', redirectTo: '/archiviste/armoires' },
      { path: 'etageres', redirectTo: '/archiviste/etageres' },
      { path: 'phases', redirectTo: '/archiviste/phases' },
      { path: 'calendrier', redirectTo: '/archiviste/calendrier' },
      { path: 'boitiers', redirectTo: '/archiviste/boitiers' },
      { path: 'dossiers', redirectTo: '/archiviste/dossiers' },
      { path: 'documents', redirectTo: '/archiviste/documents' },
      { path: 'transferts', redirectTo: '/archiviste/transferts' }
      ,{ path: 'directions', redirectTo: '/archiviste/directions' }
    ]
  },
  { path: '**', redirectTo: '/' }
];
