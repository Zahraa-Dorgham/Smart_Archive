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

import { PhaseArchiveService } from '../../core/services/phase-archive.service';
import { PhaseArchive } from '../../core/models/phase-archive.model';
import { PaginatedResponse } from '../../core/models/base.model';
import { AddEditPhaseComponent } from '../add-edit-phase/add-edit-phase';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-show-phase',
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
    AddEditPhaseComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './show-phase.html',
  styleUrls: ['./show-phase.css']
})
export class ShowPhaseComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<PhaseArchive>([]);
  displayedColumns: string[] = ['nom', 'code', 'type_phase', 'duree', 'action_finale', 'ordre', 'actions'];
  filterForm: FormGroup;

  constructor(
    private phaseService: PhaseArchiveService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadPhases();
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  loadPhases(): void {
    this.loadingService.show();
    this.phaseService.getPhases().subscribe({
      next: (response: PaginatedResponse<PhaseArchive>) => {
        this.dataSource.data = response.results;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loadingService.hide();
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 });
        this.loadingService.hide();
      }
    });
  }

  applyFilter(): void {
    const filter = this.filterForm.value;
    this.dataSource.filterPredicate = (data: PhaseArchive, filterStr: string) => {
      const searchTerm = filter.search?.toLowerCase().trim() || '';
      if (!searchTerm) return true;
      return !!(data.nom.toLowerCase().includes(searchTerm) ||
        (data.code && data.code.toLowerCase().includes(searchTerm)));
    };
    this.dataSource.filter = filter.search || '';
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditPhaseComponent, {
      width: '600px',
      data: { mode: 'add' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadPhases();
    });
  }

  openEditDialog(phase: PhaseArchive): void {
    const dialogRef = this.dialog.open(AddEditPhaseComponent, {
      width: '600px',
      data: { mode: 'edit', phase }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadPhases();
    });
  }

  deletePhase(phase: PhaseArchive): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de suppression',
        message: `Voulez-vous vraiment supprimer la phase "${phase.nom}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.phaseService.deletePhase(phase.id).subscribe({
          next: () => {
            this.snackBar.open('Phase supprimée', 'Fermer', { duration: 3000 });
            this.loadPhases();
          },
          error: (err) => {
            this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
            this.loadingService.hide();
          }
        });
      }
    });
  }
}