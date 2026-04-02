// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { MatCardModule } from '@angular/material/card';
// import { MatGridListModule } from '@angular/material/grid-list';
// import { MatIconModule } from '@angular/material/icon';
// import { MatButtonModule } from '@angular/material/button';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// import { BatimentService } from '../core/services/batiment.service';
// import { SalleService } from '../core/services/salle.service';
// import { ArmoireService } from '../core/services/armoire.service';
// import { EtagereService } from '../core/services/etagere.service';
// import { BoitierService } from '../core/services/boitier.service';
// import { DossierService } from '../core/services/dossier.service';
// import { DocumentService } from '../core/services/document.service';
// import { LoadingService } from '../core/services/loading.service';

// @Component({
//     selector: 'app-dashboard',
//     standalone: true,
//     imports: [
//         CommonModule,
//         RouterModule,
//         MatCardModule,
//         MatGridListModule,
//         MatIconModule,
//         MatButtonModule,
//         MatProgressSpinnerModule
//     ],
//     template: `
//     <div class="dashboard-container">
//       <h1>Tableau de bord</h1>
//       <p>Bienvenue sur votre espace d'archivage.</p>

//       <div class="stats-grid" *ngIf="!loading; else spinner">
//         <mat-card class="stat-card">
//           <mat-card-content>
//             <div class="stat-icon"><mat-icon>business</mat-icon></div>
//             <div class="stat-value">{{ stats.batiments }}</div>
//             <div class="stat-label">Bâtiments</div>
//           </mat-card-content>
//           <mat-card-actions>
//             <button mat-button routerLink="/batiments">Voir</button>
//           </mat-card-actions>
//         </mat-card>

//         <mat-card class="stat-card">
//           <mat-card-content>
//             <div class="stat-icon"><mat-icon>meeting_room</mat-icon></div>
//             <div class="stat-value">{{ stats.salles }}</div>
//             <div class="stat-label">Salles</div>
//           </mat-card-content>
//           <mat-card-actions>
//             <button mat-button routerLink="/salles">Voir</button>
//           </mat-card-actions>
//         </mat-card>

//         <mat-card class="stat-card">
//           <mat-card-content>
//             <div class="stat-icon"><mat-icon>cabinet</mat-icon></div>
//             <div class="stat-value">{{ stats.armoires }}</div>
//             <div class="stat-label">Armoires</div>
//           </mat-card-content>
//           <mat-card-actions>
//             <button mat-button routerLink="/armoires">Voir</button>
//           </mat-card-actions>
//         </mat-card>

//         <mat-card class="stat-card">
//           <mat-card-content>
//             <div class="stat-icon"><mat-icon>shelves</mat-icon></div>
//             <div class="stat-value">{{ stats.etageres }}</div>
//             <div class="stat-label">Étagères</div>
//           </mat-card-content>
//           <mat-card-actions>
//             <button mat-button routerLink="/etageres">Voir</button>
//           </mat-card-actions>
//         </mat-card>

//         <mat-card class="stat-card">
//           <mat-card-content>
//             <div class="stat-icon"><mat-icon>inventory</mat-icon></div>
//             <div class="stat-value">{{ stats.boitiers }}</div>
//             <div class="stat-label">Boîtiers</div>
//           </mat-card-content>
//           <mat-card-actions>
//             <button mat-button routerLink="/boitiers">Voir</button>
//           </mat-card-actions>
//         </mat-card>

//         <mat-card class="stat-card">
//           <mat-card-content>
//             <div class="stat-icon"><mat-icon>folder</mat-icon></div>
//             <div class="stat-value">{{ stats.dossiers }}</div>
//             <div class="stat-label">Dossiers</div>
//           </mat-card-content>
//           <mat-card-actions>
//             <button mat-button routerLink="/dossiers">Voir</button>
//           </mat-card-actions>
//         </mat-card>

//         <mat-card class="stat-card">
//           <mat-card-content>
//             <div class="stat-icon"><mat-icon>description</mat-icon></div>
//             <div class="stat-value">{{ stats.documents }}</div>
//             <div class="stat-label">Documents</div>
//           </mat-card-content>
//           <mat-card-actions>
//             <button mat-button routerLink="/documents">Voir</button>
//           </mat-card-actions>
//         </mat-card>
//       </div>

//       <ng-template #spinner>
//         <div class="spinner-container">
//           <mat-spinner diameter="40"></mat-spinner>
//         </div>
//       </ng-template>
//     </div>
//   `,
//     styles: [`
//     .dashboard-container {
//       padding: 20px;
//     }
//     h1 {
//       margin-bottom: 8px;
//     }
//     .stats-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
//       gap: 20px;
//       margin-top: 24px;
//     }
//     .stat-card {
//       text-align: center;
//       transition: transform 0.2s;
//     }
//     .stat-card:hover {
//       transform: translateY(-4px);
//     }
//     .stat-icon mat-icon {
//       font-size: 48px;
//       width: 48px;
//       height: 48px;
//       color: #3f51b5;
//     }
//     .stat-value {
//       font-size: 32px;
//       font-weight: 500;
//       margin: 8px 0;
//     }
//     .stat-label {
//       color: #666;
//       font-size: 14px;
//     }
//     mat-card-actions {
//       padding-bottom: 16px;
//     }
//     .spinner-container {
//       display: flex;
//       justify-content: center;
//       align-items: center;
//       min-height: 200px;
//     }
//   `]
// })
// export class DashboardComponent implements OnInit {
//     stats = {
//         batiments: 0,
//         salles: 0,
//         armoires: 0,
//         etageres: 0,
//         boitiers: 0,
//         dossiers: 0,
//         documents: 0
//     };
//     loading = true;

//     constructor(
//         private batimentService: BatimentService,
//         private salleService: SalleService,
//         private armoireService: ArmoireService,
//         private etagereService: EtagereService,
//         private boitierService: BoitierService,
//         private dossierService: DossierService,
//         private documentService: DocumentService,
//         private loadingService: LoadingService
//     ) { }

//     ngOnInit(): void {
//         this.loadStats();
//     }

//     loadStats(): void {
//         this.loading = true;
//         // Récupérer les nombres via les API (on suppose que chaque service a une méthode getCount ou on utilise les listes avec pagination)
//         // Option simple : récupérer la première page et utiliser le count
//         Promise.all([
//             this.batimentService.getBatiments().toPromise(),
//             this.salleService.getSalles().toPromise(),
//             this.armoireService.getArmoires().toPromise(),
//             this.etagereService.getEtageres().toPromise(),
//             this.boitierService.getBoitiers().toPromise(),
//             this.dossierService.getDossiers().toPromise(),
//             this.documentService.getDocuments().toPromise()
//         ]).then(responses => {
//             this.stats.batiments = responses[0]?.count || 0;
//             this.stats.salles = responses[1]?.count || 0;
//             this.stats.armoires = responses[2]?.count || 0;
//             this.stats.etageres = responses[3]?.count || 0;
//             this.stats.boitiers = responses[4]?.count || 0;
//             this.stats.dossiers = responses[5]?.count || 0;
//             this.stats.documents = responses[6]?.count || 0;
//             this.loading = false;
//         }).catch(err => {
//             console.error('Erreur chargement statistiques', err);
//             this.loading = false;
//         });
//     }
// }