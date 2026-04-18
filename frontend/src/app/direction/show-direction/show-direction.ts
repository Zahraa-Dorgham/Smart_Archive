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
import { DirectionService } from '../../core/services/direction.service';
import { Direction } from '../../core/models/direction.model';
import { PaginatedResponse } from '../../core/models/base.model';
import { AddEditDirectionComponent } from '../add-edit-direction/add-edit-direction';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-show-direction',
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
    AddEditDirectionComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './show-direction.html',
  styleUrls: ['./show-direction.css']
})
export class ShowDirectionComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Direction>([]);
  displayedColumns: string[] = ['nom', 'code', 'actions'];
  filterForm: FormGroup;

  constructor(
    private directionService: DirectionService,
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
    this.loadDirections();
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  loadDirections(): void {
    this.loadingService.show();
    this.directionService.getDirections().subscribe({
      next: (response: PaginatedResponse<Direction>) => {
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
    this.dataSource.filterPredicate = (data: Direction, filter: string) => {
      return data.nom.toLowerCase().includes(filter) || (data.code ? data.code.toLowerCase().includes(filter) : false);
    };
    this.dataSource.filter = filterValue || '';
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditDirectionComponent, {
      width: '600px',
      data: { mode: 'add' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadDirections();
    });
  }

  openEditDialog(direction: Direction): void {
    const dialogRef = this.dialog.open(AddEditDirectionComponent, {
      width: '600px',
      data: { mode: 'edit', direction }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadDirections();
    });
  }

  deleteDirection(direction: Direction): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de suppression',
        message: `Voulez-vous vraiment supprimer "${direction.nom}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.directionService.deleteDirection(direction.id).subscribe({
          next: () => {
            this.snackBar.open('Direction supprimée', 'Fermer', { duration: 3000 });
            this.loadDirections();
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
