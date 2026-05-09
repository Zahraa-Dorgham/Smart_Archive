import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { PaginatedResponse } from '../../core/models/base.model';
import { Transfert } from '../../core/models/transfert.model';
import { LoadingService } from '../../core/services/loading.service';
import { TransfertService } from '../../core/services/transfert.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { AddEditTransfertComponent } from '../add-edit-transfert/add-edit-transfert';

@Component({
  selector: 'app-show-transfert',
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
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    AddEditTransfertComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './show-transfert.html',
  styleUrls: ['./show-transfert.css']
})
export class ShowTransfertComponent implements OnInit {
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

  dataSource = new MatTableDataSource<Transfert>([]);
  filterForm: FormGroup;

  readonly typeOptions = ['INTERMEDIAIRE', 'FINAL'];
  readonly statusOptions = ['EN_ATTENTE', 'VALIDE', 'ANNULE', 'EXECUTE'];

  constructor(
    private transfertService: TransfertService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      statut: [''],
      typeTransfer: ['']
    });
  }

  ngOnInit(): void {
    this.loadTransferts();
    this.filterForm.valueChanges.subscribe(() => this.applyFilter());
  }

  loadTransferts(): void {
    this.loadingService.show();
    this.transfertService.getTransferts({ page_size: 1000 }).subscribe({
      next: (response: PaginatedResponse<Transfert>) => {
        this.dataSource.data = response.results;
        this.loadingService.hide();
      },
      error: () => {
        this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 });
        this.loadingService.hide();
      }
    });
  }

  applyFilter(): void {
    const filter = this.filterForm.getRawValue();

    this.dataSource.filterPredicate = (data: Transfert) => {
      const searchTerm = filter.search?.toLowerCase().trim() || '';
      const statutMatch = !filter.statut || data.statut === filter.statut;
      const typeMatch = !filter.typeTransfer || data.typeTransfer === filter.typeTransfer;
      const boitiers = this.getBoitiersLabel(data).toLowerCase();
      const searchMatch = !searchTerm ||
        (data.reference || '').toLowerCase().includes(searchTerm) ||
        (data.bordereauxReference || '').toLowerCase().includes(searchTerm) ||
        boitiers.includes(searchTerm);

      return searchMatch && statutMatch && typeMatch;
    };

    this.dataSource.filter = JSON.stringify(filter);
  }

  getBoitiersLabel(transfert: Transfert): string {
    return (transfert.boitiers_detail || []).map(item => item.idboit).join(', ') || 'Aucun';
  }

  getStatusBadgeClass(statut: string): string {
    switch (statut) {
      case 'VALIDE':
        return 'badge badge-light-success';
      case 'ANNULE':
        return 'badge badge-light-danger';
      case 'EXECUTE':
        return 'badge badge-light-info';
      default:
        return 'badge badge-light-warning';
    }
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditTransfertComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTransferts();
      }
    });
  }

  openEditDialog(transfert: Transfert): void {
    if (transfert.statut === 'VALIDE') {
      this.snackBar.open('Ce transfert est valide et ne peut plus etre modifie.', 'Fermer', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(AddEditTransfertComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { mode: 'edit', transfert }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTransferts();
      }
    });
  }

  validateTransfert(transfert: Transfert): void {
    this.transfertService.validateTransfert(String(transfert.id)).subscribe({
      next: () => {
        this.snackBar.open('Transfert valide', 'Fermer', { duration: 3000 });
        this.loadTransferts();
      },
      error: () => {
        this.snackBar.open('Erreur validation', 'Fermer', { duration: 3000 });
      }
    });
  }

  generateBordereau(transfert: Transfert): void {
    if (transfert.statut !== 'VALIDE') {
      this.snackBar.open('Le bordereau est disponible uniquement pour un transfert valide.', 'Fermer', { duration: 3000 });
      return;
    }

    this.transfertService.downloadBordereauPdf(String(transfert.id)).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      },
      error: () => {
        this.snackBar.open('Erreur generation bordereau', 'Fermer', { duration: 3000 });
      }
    });
  }

  deleteTransfert(transfert: Transfert): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation',
        message: `Supprimer le transfert ${transfert.reference || transfert.id} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.transfertService.deleteTransfert(String(transfert.id)).subscribe({
          next: () => {
            this.snackBar.open('Transfert supprime', 'Fermer', { duration: 3000 });
            this.loadTransferts();
          },
          error: () => {
            this.snackBar.open('Erreur suppression', 'Fermer', { duration: 3000 });
            this.loadingService.hide();
          }
        });
      }
    });
  }
}
