import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/batiments', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'batiments',
    canActivate: [authGuard],
    loadComponent: () => import('./batiment/show-batiment/show-batiment').then(m => m.ShowBatimentComponent)
  },
  // Ajoutez les autres routes protégées ici
  {
    path: 'salles',
    canActivate: [authGuard],
    loadComponent: () => import('./salles/show-salle/show-salle').then(m => m.ShowSalleComponent)
  },
  {
  path: 'armoires',   // <-- route pour les armoires
  canActivate: [authGuard],
  loadComponent: () => import('./armoires/show-armoire/show-armoire').then(m => m.ShowArmoireComponent)
  },
  {
    path: 'etageres',
    canActivate: [authGuard],
    loadComponent: () => import('./etageres/show-etagere/show-etagere').then(m => m.ShowEtagereComponent)
  },
  {
    path: 'phases',
    canActivate: [authGuard],
    loadComponent: () => import('./phases/show-phase/show-phase').then(m => m.ShowPhaseComponent)
  }
];