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
import { MatSelectModule } from '@angular/material/select';

import { SalleService } from '../../core/services/salle.service';
import { BatimentService } from '../../core/services/batiment.service';
import { Salle  } from '../../core/models/salle.model';
import { AddEditSalleComponent } from '../add-edit-salle/add-edit-salle';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { LoadingService } from '../../core/services/loading.service';

import { PaginatedResponse } from '../../core/models/base.model';

@Component({
  selector: 'app-show-salle',
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
    MatSelectModule,
    AddEditSalleComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './show-salle.html',
  styleUrls: ['./show-salle.css']
})
export class ShowSalleComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Salle>([]);
  displayedColumns: string[] = ['code', 'nom', 'batiment_nom', 'type_salle', 'etage', 'actions'];
  filterForm: FormGroup;
  batiments: any[] = [];

  constructor(
    private salleService: SalleService,
    private batimentService: BatimentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      batiment: ['']
    });
  }

  ngOnInit(): void {
    this.loadBatiments();
    this.loadSalles();
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  loadBatiments(): void {
    this.batimentService.getBatiments().subscribe({
      next: (res) => {
        this.batiments = res.results;
      },
      error: (err) => console.error('Erreur chargement bâtiments', err)
    });
  }

  loadSalles(): void {
    this.loadingService.show();
    this.salleService.getSalles().subscribe({
      next: (response: PaginatedResponse<Salle>) => {
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
    const filterValue = this.filterForm.get('search')?.value?.trim().toLowerCase();
    const batimentId = this.filterForm.get('batiment')?.value;

    this.dataSource.filterPredicate = (data: Salle, filter: string) => {
      const matchesSearch = !filterValue || 
        data.nom.toLowerCase().includes(filterValue) ||
        data.code.toLowerCase().includes(filterValue);
      const matchesBatiment = !batimentId || data.batiment === batimentId;
      return matchesSearch && matchesBatiment;
    };
    this.dataSource.filter = filterValue + batimentId; // trick to trigger filter
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditSalleComponent, {
      width: '600px',
      data: { mode: 'add', batiments: this.batiments }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadSalles();
    });
  }

  openEditDialog(salle: Salle): void {
    const dialogRef = this.dialog.open(AddEditSalleComponent, {
      width: '600px',
      data: { mode: 'edit', salle, batiments: this.batiments }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadSalles();
    });
  }

  deleteSalle(salle: Salle): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de suppression',
        message: `Supprimer la salle "${salle.nom}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.salleService.deleteSalle(salle.id).subscribe({
          next: () => {
            this.snackBar.open('Salle supprimée', 'Fermer', { duration: 3000 });
            this.loadSalles();
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