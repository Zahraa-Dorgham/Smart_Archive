import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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

import { Calendrier } from '../../core/models/calendrier.model';
import { DossierService } from '../../core/services/dossier.service';
import { PhaseArchiveService } from '../../core/services/phase-archive.service';
import { Dossier } from '../../core/models/dossier.model';
import { PhaseArchive } from '../../core/models/phase-archive.model';
import { Boitier } from '../../core/models/boitier.model';
import { PaginatedResponse } from '../../core/models/base.model';
import { AddEditDossierComponent } from '../add-edit-dossier/add-edit-dossier';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { LoadingService } from '../../core/services/loading.service';

function isPhaseArchive(obj: unknown): obj is PhaseArchive {
  return !!obj && typeof obj === 'object' && 'id' in obj && 'nom' in obj;
}

function isBoitier(obj: unknown): obj is Boitier {
  return !!obj && typeof obj === 'object' && 'id' in obj && 'idboit' in obj;
}

function isCalendrier(obj: unknown): obj is Calendrier {
  return !!obj && typeof obj === 'object' && 'id' in obj && 'code' in obj && 'title' in obj;
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
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    if (paginator) {
      this.dataSource.paginator = paginator;
    }
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  dataSource = new MatTableDataSource<Dossier>([]);
  displayedColumns: string[] = ['idDossier', 'nomDos', 'calendrier', 'phase', 'boitier', 'date_creation', 'nb_docs', 'actions'];
  filterForm: FormGroup;
  phases: PhaseArchive[] = [];
  boitierFilter: string | null = null;

  constructor(
    private dossierService: DossierService,
    private phaseService: PhaseArchiveService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      phase: [''],
      phaseType: ['']
    });
  }

  ngOnInit(): void {
    this.loadPhases();
    this.route.queryParams.subscribe(params => {
      this.boitierFilter = params['boitier'] || null;
      this.loadDossiers();
    });
    this.filterForm.valueChanges.subscribe(() => this.applyFilter());
  }

  loadPhases(): void {
    this.phaseService.getPhases({ page_size: 1000 }).subscribe({
      next: (response: PaginatedResponse<PhaseArchive>) => {
        this.phases = response.results;
      },
      error: (err) => console.error('Erreur chargement phases', err)
    });
  }

  loadDossiers(): void {
    this.loadingService.show();
    const params: any = { page_size: 1000 };
    if (this.boitierFilter) {
      params.boitier = this.boitierFilter;
    }
    this.dossierService.getDossiers(params).subscribe({
      next: (response: PaginatedResponse<Dossier>) => {
        this.dataSource.data = response.results;
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
    const filter = this.filterForm.getRawValue();

    this.dataSource.filterPredicate = (data: Dossier) => {
      const searchTerm = filter.search?.toLowerCase().trim() || '';
      const phaseId = this.getPhaseId(data);
      const phaseMatch = !filter.phase || phaseId === filter.phase;
      const phaseTypeMatch = !filter.phaseType || data.phaseType === filter.phaseType;
      const searchMatch = !searchTerm ||
        String(data.idDossier).includes(searchTerm) ||
        (data.nomDos || '').toLowerCase().includes(searchTerm);

      return searchMatch && phaseMatch && phaseTypeMatch;
    };

    this.dataSource.filter = JSON.stringify(filter);
  }

  getPhaseId(dossier: Dossier): string | null {
    if (dossier.phaseArchive && isPhaseArchive(dossier.phaseArchive)) {
      return String(dossier.phaseArchive.id);
    }

    return dossier.phaseArchive ? String(dossier.phaseArchive) : null;
  }

  getPhaseNom(dossier: Dossier): string {
    if (dossier.phaseArchive && isPhaseArchive(dossier.phaseArchive)) {
      return dossier.phaseArchive.nom;
    }

    return dossier.phaseArchive_nom || 'N/A';
  }

  getBoitierId(dossier: Dossier): string {
    if (dossier.boitier && isBoitier(dossier.boitier)) {
      return dossier.boitier.idboit;
    }

    return dossier.boitier_idboit || 'Aucun';
  }

  getCalendrierLabel(dossier: Dossier): string {
    if (dossier.calendrier && isCalendrier(dossier.calendrier)) {
      return `${dossier.calendrier.code} - ${dossier.calendrier.title}`;
    }

    if (dossier.calendrier_code || dossier.calendrier_title) {
      return `${dossier.calendrier_code || ''}${dossier.calendrier_code && dossier.calendrier_title ? ' - ' : ''}${dossier.calendrier_title || ''}`;
    }

    return 'Aucun';
  }

  getPhaseTypeColor(phaseType: string): string {
    switch (phaseType) {
      case 'COURANTE': return 'primary';
      case 'INTERMEDIAIRE': return 'accent';
      case 'DEFINITIVE': return 'warn';
      default: return '';
    }
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditDossierComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDossiers();
      }
    });
  }

  openEditDialog(dossier: Dossier): void {
    const dialogRef = this.dialog.open(AddEditDossierComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { mode: 'edit', dossier }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDossiers();
      }
    });
  }

  deleteDossier(dossier: Dossier): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation',
        message: `Supprimer le dossier ${dossier.nomDos || dossier.idDossier} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.dossierService.deleteDossier(String(dossier.idDossier)).subscribe({
          next: () => {
            this.snackBar.open('Dossier supprime', 'Fermer', { duration: 3000 });
            this.loadDossiers();
          },
          error: () => {
            this.snackBar.open('Erreur suppression', 'Fermer', { duration: 3000 });
            this.loadingService.hide();
          }
        });
      }
    });
  }

  viewDocuments(dossier: Dossier): void {
    this.router.navigate(['/archiviste/documents'], {
      queryParams: { dossier: dossier.idDossier }
    });
  }
}
