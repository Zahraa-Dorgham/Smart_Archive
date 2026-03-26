import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { DossierService } from '../../core/services/dossier.service';
import { PhaseArchiveService } from '../../core/services/phase-archive.service';
import { Dossier } from '../../core/models/dossier.model';
import { PhaseArchive } from '../../core/models/phase-archive.model';
import { Boitier } from '../../core/models/boitier.model';
import { PaginatedResponse } from '../../core/models/base.model';
import { AddEditDossierComponent } from '../add-edit-dossier/add-edit-dossier';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { LoadingService } from '../../core/services/loading.service';

// Type guards
function isPhaseArchive(obj: any): obj is PhaseArchive {
  return obj && typeof obj === 'object' && 'id' in obj && 'nom' in obj;
}

function isBoitier(obj: any): obj is Boitier {
  return obj && typeof obj === 'object' && 'id' in obj && 'idboit' in obj;
}

@Component({
  selector: 'app-show-dossier',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressBarModule,
    AddEditDossierComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './show-dossier.html',
  styleUrls: ['./show-dossier.css']
})
export class ShowDossierComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Dossier>([]);
  displayedColumns: string[] = ['reference', 'titre', 'phase', 'boitier', 'statut', 'confidentialite', 'date_creation', 'nb_docs', 'actions'];
  filterForm: FormGroup;
  phases: PhaseArchive[] = [];

  constructor(
    private dossierService: DossierService,
    private phaseService: PhaseArchiveService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      phase: [''],
      statut: ['']
    });
  }

  ngOnInit(): void {
    this.loadPhases();
    this.loadDossiers();
    this.filterForm.valueChanges.subscribe(() => this.applyFilter());
  }

  loadPhases(): void {
    this.phaseService.getPhases().subscribe({
      next: (response: PaginatedResponse<PhaseArchive>) => {
        this.phases = response.results;
      },
      error: (err) => console.error('Erreur chargement phases', err)
    });
  }

  loadDossiers(): void {
    this.loadingService.show();
    this.dossierService.getDossiers().subscribe({
      next: (response: PaginatedResponse<Dossier>) => {
        this.dataSource.data = response.results;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loadingService.hide();
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 });
        this.loadingService.hide();
      }
    });
  }

  applyFilter(): void {
    const filter = this.filterForm.value;
    this.dataSource.filterPredicate = (data: Dossier, filterStr: string) => {
      const searchTerm = filter.search?.toLowerCase().trim() || '';
      const phaseMatch = !filter.phase ||
        (isPhaseArchive(data.phase_archive) ? data.phase_archive.id === filter.phase : data.phase_archive === filter.phase);
      const statutMatch = !filter.statut || data.statut === filter.statut;
      const searchMatch = !searchTerm ||
        data.reference.toLowerCase().includes(searchTerm) ||
        data.titre.toLowerCase().includes(searchTerm);
      return searchMatch && phaseMatch && statutMatch;
    };
    this.dataSource.filter = filter.search || '';
  }

  getPhaseNom(d: Dossier): string {
    if (isPhaseArchive(d.phase_archive)) {
      return d.phase_archive.nom;
    }
    return (d as any).phase_nom || 'N/A';
  }

  getBoitierId(d: Dossier): string {
    if (isBoitier(d.boitier)) {
      return d.boitier.idboit;
    }
    return (d.boitier as string) || 'Aucun';
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'ACTIF': return 'primary';
      case 'CLOS': return '';
      case 'TRANSFERE': return 'accent';
      case 'DETRUIT': return 'warn';
      default: return '';
    }
  }

  getConfidentialiteColor(niveau: string): string {
    switch (niveau) {
      case 'PUBLIC': return 'primary';
      case 'INTERNE': return 'accent';
      case 'CONFIDENTIEL': return 'warn';
      case 'SECRET': return 'warn';
      default: return '';
    }
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditDossierComponent, {
      width: '600px',
      data: { mode: 'add' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadDossiers();
    });
  }

  openEditDialog(dossier: Dossier): void {
    const dialogRef = this.dialog.open(AddEditDossierComponent, {
      width: '600px',
      data: { mode: 'edit', dossier }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadDossiers();
    });
  }

  deleteDossier(dossier: Dossier): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation',
        message: `Supprimer le dossier ${dossier.reference} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.dossierService.deleteDossier(dossier.id).subscribe({
          next: () => {
            this.snackBar.open('Dossier supprimé', 'Fermer', { duration: 3000 });
            this.loadDossiers();
          },
          error: (err) => {
            this.snackBar.open('Erreur suppression', 'Fermer', { duration: 3000 });
            this.loadingService.hide();
          }
        });
      }
    });
  }
}