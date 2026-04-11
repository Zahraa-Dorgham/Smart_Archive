import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LayoutPublicComponent } from './layout/layout-public/layout-public';
import { LayoutComponent } from './layout/layout-authentifie/layout-authentifie';
import { HomeComponent } from './home/home';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutPublicComponent,
    
    children: [
      { path: '', component: LoginComponent },
      // { path: 'home', loadComponent: () => import('./home/home').then(m => m.HomeComponent) },
      { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) }
    ]
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      // Routes admin
      {
        path: 'admin',
        canActivate: [() => roleGuard(['Administrateur'])()],
        children: [
          { path: 'users', loadComponent: () => import('./modules/admin/user-list/user-list').then(m => m.UserListComponent) },
          { path: 'users/new', loadComponent: () => import('./modules/admin/user-form/user-form').then(m => m.UserFormComponent) },
          { path: 'users/:id/edit', loadComponent: () => import('./modules/admin/user-form/user-form').then(m => m.UserFormComponent) },
          { path: '', redirectTo: 'users', pathMatch: 'full' }
        ]
      },
      // Routes archiviste
      {
        path: 'archiviste',
        canActivate: [() => roleGuard(['Archiviste', 'Administrateur'])()],
        children: [
          { path: 'batiments', loadComponent: () => import('./batiment/show-batiment/show-batiment').then(m => m.ShowBatimentComponent) },
          { path: 'salles', loadComponent: () => import('./salles/show-salle/show-salle').then(m => m.ShowSalleComponent) },
          { path: 'armoires', loadComponent: () => import('./armoires/show-armoire/show-armoire').then(m => m.ShowArmoireComponent) },
          { path: 'etageres', loadComponent: () => import('./etageres/show-etagere/show-etagere').then(m => m.ShowEtagereComponent) },
          { path: 'phases', loadComponent: () => import('./phases/show-phase/show-phase').then(m => m.ShowPhaseComponent) },
          { path: 'boitiers', loadComponent: () => import('./boitiers/show-boitier/show-boitier').then(m => m.ShowBoitierComponent) },
          { path: 'dossiers', loadComponent: () => import('./dossiers/show-dossier/show-dossier').then(m => m.ShowDossierComponent) },
          { path: 'documents', loadComponent: () => import('./documents/show-doc/show-doc').then(m => m.ShowDocumentComponent) },
          { path: '', redirectTo: 'batiments', pathMatch: 'full' }
        ]
      },
      // Routes responsable
      {
        path: 'responsable',
        canActivate: [() => roleGuard(['Responsable', 'Archiviste', 'Administrateur'])()],
        children: [
          // { path: 'transferts', loadComponent: () => import('./modules/responsable/transfert-list/transfert-list').then(m => m.TransfertListComponent) },
          // { path: 'statistiques', loadComponent: () => import('./modules/responsable/statistiques/statistiques').then(m => m.StatistiquesComponent) },
          // { path: '', redirectTo: 'transferts', pathMatch: 'full' }
        ]
      },
      // Routes employé
      {
        path: 'employe',
        canActivate: [() => roleGuard(['Employé'])()],
        children: [
          // { path: 'recherche', loadComponent: () => import('./modules/employe/recherche-document/recherche-document').then(m => m.RechercheDocumentComponent) },
          // { path: 'mes-demandes', loadComponent: () => import('./modules/employe/mes-demandes/mes-demandes').then(m => m.MesDemandesComponent) },
          // { path: '', redirectTo: 'recherche', pathMatch: 'full' }
        ]
      },
      // Redirections routes
      { path: 'batiments', redirectTo: '/archiviste/batiments' },
      { path: 'salles', redirectTo: '/archiviste/salles' },
      { path: 'armoires', redirectTo: '/archiviste/armoires' },
      { path: 'etageres', redirectTo: '/archiviste/etageres' },
      { path: 'phases', redirectTo: '/archiviste/phases' },
      { path: 'boitiers', redirectTo: '/archiviste/boitiers' },
      { path: 'dossiers', redirectTo: '/archiviste/dossiers' },
      { path: 'documents', redirectTo: '/archiviste/documents' }
    ]
  },
  { path: '**', redirectTo: '/' }
];