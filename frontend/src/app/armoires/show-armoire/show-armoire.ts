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

import { ArmoireService } from '../../core/services/armoire.service';
import { SalleService } from '../../core/services/salle.service';
import { Armoire } from '../../core/models/armoire.model';
import { AddEditArmoireComponent } from '../add-edit-armoire/add-edit-armoire';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { LoadingService } from '../../core/services/loading.service';

import { PaginatedResponse } from '../../core/models/base.model';

@Component({
  selector: 'app-show-armoire',
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
    AddEditArmoireComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './show-armoire.html',
  styleUrls: ['./show-armoire.css']
})
export class ShowArmoireComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Armoire>([]);
  displayedColumns: string[] = ['code', 'type', 'salle', 'code_barres', 'actions'];
  filterForm: FormGroup;
  salles: any[] = [];

  constructor(
    private armoireService: ArmoireService,
    private salleService: SalleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      salle: ['']
    });
  }

  ngOnInit(): void {
    this.loadSalles();
    this.loadArmoires();
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  loadSalles(): void {
    this.salleService.getSalles().subscribe({
      next: (res) => {
        this.salles = res.results;
      }
    });
  }

  loadArmoires(): void {
    this.loadingService.show();
    this.armoireService.getArmoires().subscribe({
      next: (response: PaginatedResponse<Armoire>) => {
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
    this.dataSource.filterPredicate = (data: Armoire, filterStr: string) => {
      const searchMatch = !filter.search ||
        data.code.toLowerCase().includes(filter.search.toLowerCase()) ||
        (data.code_barres && data.code_barres.toLowerCase().includes(filter.search.toLowerCase()))
        ? true : false; // ← transformation en booléen explicite
      const salleMatch = !filter.salle ||
        (typeof data.salle === 'object' ? data.salle.id === filter.salle : data.salle === filter.salle);
      return searchMatch && salleMatch; // ces deux variables sont maintenant des booléens
    };
    this.dataSource.filter = 'apply';
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditArmoireComponent, {
      width: '600px',
      data: { mode: 'add' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadArmoires();
    });
  }

  openEditDialog(armoire: Armoire): void {
    const dialogRef = this.dialog.open(AddEditArmoireComponent, {
      width: '600px',
      data: { mode: 'edit', armoire }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadArmoires();
    });
  }

  deleteArmoire(armoire: Armoire): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de suppression',
        message: `Voulez-vous vraiment supprimer l'armoire "${armoire.code}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.armoireService.deleteArmoire(armoire.id).subscribe({
          next: () => {
            this.snackBar.open('Armoire supprimée', 'Fermer', { duration: 3000 });
            this.loadArmoires();
          },
          error: (err) => {
            this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
            this.loadingService.hide();
          }
        });
      }
    });
  }

  getSalleNom(armoire: Armoire): string {
    if (typeof armoire.salle === 'object') {
      return armoire.salle.nom;
    }
    return armoire.salle_nom?.nom || 'N/A';
  }
}