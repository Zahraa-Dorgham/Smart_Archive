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
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { EtagereService } from '../../core/services/etagere.service';
import { ArmoireService } from '../../core/services/armoire.service';
import { Etagere } from '../../core/models/etagere.model';
import { PaginatedResponse } from '../../core/models/base.model';
import { AddEditEtagereComponent } from '../add-edit-etagere/add-edit-etagere';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-show-etagere',
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
    MatProgressBarModule,
    AddEditEtagereComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './show-etagere.html',
  styleUrls: ['./show-etagere.css']
})
export class ShowEtagereComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Etagere>([]);
  displayedColumns: string[] = ['numero', 'armoire', 'code_barres', 'capacite', 'occupation', 'taux', 'actions'];
  filterForm: FormGroup;
  armoires: any[] = [];

  constructor(
    private etagereService: EtagereService,
    private armoireService: ArmoireService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      armoire: ['']
    });
  }

  ngOnInit(): void {
    this.loadArmoires();
    this.loadEtageres();
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  loadArmoires(): void {
    this.armoireService.getArmoires().subscribe({
      next: (res) => {
        this.armoires = res.results;
      }
    });
  }

  loadEtageres(): void {
    this.loadingService.show();
    this.etagereService.getEtageres().subscribe({
      next: (response: PaginatedResponse<Etagere>) => {
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
    this.dataSource.filterPredicate = (data: Etagere, filterStr: string) => {
      const searchTerm = filter.search?.toLowerCase().trim() || '';
      const searchMatch = !searchTerm ||
        data.numero.toString().includes(searchTerm) ||
        (data.code_barres && data.code_barres.toLowerCase().includes(searchTerm));

      const armoireId = filter.armoire;
      const armoireMatch = !armoireId ||
        (typeof data.armoire === 'object' ? data.armoire.id === armoireId : data.armoire === armoireId);

      return !!(searchMatch && armoireMatch);
    };
    this.dataSource.filter = 'apply';
  }

  getArmoireCode(etagere: Etagere): string {
    if (typeof etagere.armoire === 'object') {
      return etagere.armoire.code;
    }
    // Si vous avez un champ armoire_code fourni par le sérialiseur
    return (etagere as any).armoire_code || 'N/A';
  }

  getTauxOccupation(etagere: Etagere): number {
    return (etagere.occupation_actuelle / etagere.capacite_max_boites) * 100;
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditEtagereComponent, {
      width: '600px',
      data: { mode: 'add' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadEtageres();
    });
  }

  openEditDialog(etagere: Etagere): void {
    const dialogRef = this.dialog.open(AddEditEtagereComponent, {
      width: '600px',
      data: { mode: 'edit', etagere }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadEtageres();
    });
  }

  deleteEtagere(etagere: Etagere): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de suppression',
        message: `Voulez-vous vraiment supprimer l'étagère n°${etagere.numero} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.etagereService.deleteEtagere(etagere.id).subscribe({
          next: () => {
            this.snackBar.open('Étagère supprimée', 'Fermer', { duration: 3000 });
            this.loadEtageres();
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