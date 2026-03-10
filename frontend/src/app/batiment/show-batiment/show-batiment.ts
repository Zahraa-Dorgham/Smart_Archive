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
import { BatimentService } from '../../core/services/batiment.service';
import { Batiment, PaginatedResponse } from '../../core/models/batiment.model';
import { AddEditBatComponent } from '../add-edit-bat/add-edit-bat';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { LoadingService } from '../../core/services/loading.service';
 
@Component({
  selector: 'app-show-batiment',
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
    AddEditBatComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './show-batiment.html',
  styleUrls: ['./show-batiment.css']
})
export class ShowBatimentComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Batiment>([]);
  displayedColumns: string[] = ['nom', 'adresse', 'ville', 'nombre_salles', 'actions'];
  filterForm: FormGroup;

  constructor(
    private batimentService: BatimentService,
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
    this.loadBatiments();
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  loadBatiments(): void {
    this.loadingService.show();
    this.batimentService.getBatiments().subscribe({
      next: (response: PaginatedResponse<Batiment>) => {
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
    this.dataSource.filterPredicate = (data: Batiment, filter: string) => {
      return data.nom.toLowerCase().includes(filter) ||
        data.ville?.toLowerCase().includes(filter) ||
        data.adresse.toLowerCase().includes(filter);
    };
    this.dataSource.filter = filterValue || '';
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditBatComponent, {
      width: '600px',
      data: { mode: 'add' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadBatiments();
    });
  }

  openEditDialog(batiment: Batiment): void {
    const dialogRef = this.dialog.open(AddEditBatComponent, {
      width: '600px',
      data: { mode: 'edit', batiment }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadBatiments();
    });
  }

  deleteBatiment(batiment: Batiment): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de suppression',
        message: `Voulez-vous vraiment supprimer "${batiment.nom}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.batimentService.deleteBatiment(batiment.id).subscribe({
          next: () => {
            this.snackBar.open('Bâtiment supprimé', 'Fermer', { duration: 3000 });
            this.loadBatiments();
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