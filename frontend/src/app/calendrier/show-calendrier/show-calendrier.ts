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
import { MatCheckboxModule } from '@angular/material/checkbox';

import { CalendrierService } from '../../core/services/calendrier.service';
import { Calendrier } from '../../core/models/calendrier.model';
import { PaginatedResponse } from '../../core/models/base.model';
import { LoadingService } from '../../core/services/loading.service';
import { AddEditCalendrierComponent } from '../add-edit-calendrier/add-edit-calendrier';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-show-calendrier',
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
    AddEditCalendrierComponent,
    ConfirmDialogComponent,
    MatSnackBarModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  templateUrl: './show-calendrier.html',
  styleUrls: ['./show-calendrier.css']
})
export class ShowCalendrierComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Calendrier>([]);
  displayedColumns: string[] = ['select', 'code', 'title', 'unit_responsable', 'direction', 'exemplaire_type', 'conservation_active_period', 'conservation_semi_active_period', 'sort_final_type', 'remarques', 'actions'];
  filterForm: FormGroup;

  constructor(
    private calendrierService: CalendrierService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({ search: [''] });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditCalendrierComponent, {
      width: '90vw',
      maxWidth: '700px',
      maxHeight: '90vh',
      data: { mode: 'add' }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.loadCalendriers(); });
  }

  openEditDialog(item: Calendrier): void {
    const dialogRef = this.dialog.open(AddEditCalendrierComponent, {
      width: '90vw',
      maxWidth: '700px',
      maxHeight: '90vh',
      data: { mode: 'edit', calendrier: item }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.loadCalendriers(); });
  }

  ngOnInit(): void {
    this.loadCalendriers();
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  loadCalendriers(): void {
    this.loadingService.show();
    // Fetch a larger number of items to build the hierarchy correctly in frontend
    this.calendrierService.getCalendriers({ page_size: 200 }).subscribe({
      next: (response: PaginatedResponse<Calendrier>) => {
        const flatData = response.results;
        const hierarchicalData = this.buildHierarchy(flatData);
        
        this.dataSource.data = hierarchicalData;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loadingService.hide();
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 });
        this.loadingService.hide();
      }
    });
  }

  private buildHierarchy(items: Calendrier[]): any[] {
    const rootItems = items.filter(i => !i.parent);
    const result: any[] = [];

    rootItems.forEach(root => {
      root.level = 0;
      result.push(root);
      
      const children = items.filter(i => i.parent === root.id);
      children.forEach(child => {
        child.level = 1;
        result.push(child);
      });
    });

    // Add any orphans (items with parents not in the list)
    items.forEach(item => {
      if (!result.find(r => r.id === item.id)) {
        item.level = 0;
        result.push(item);
      }
    });

    return result;
  }

  applyFilter(): void {
    const filter = this.filterForm.value;
    this.dataSource.filterPredicate = (data: Calendrier, filterStr: string) => {
      const searchTerm = filter.search?.toLowerCase().trim() || '';
      if (!searchTerm) return true;
      return !!(
        data.title?.toLowerCase().includes(searchTerm) ||
        (data.code && data.code.toLowerCase().includes(searchTerm)) ||
        (data.direction_detail && data.direction_detail.nom && data.direction_detail.nom.toLowerCase().includes(searchTerm)) ||
        (data.unit_responsable && data.unit_responsable.toLowerCase().includes(searchTerm))
      );
    };
    this.dataSource.filter = filter.search || '';
  }

  deleteCalendrier(item: Calendrier): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de suppression',
        message: `Voulez-vous vraiment supprimer le calendrier "${item.title}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.calendrierService.deleteCalendrier(String(item.id)).subscribe({
          next: () => {
            this.snackBar.open('Supprimé', 'Fermer', { duration: 2000 });
            this.loadCalendriers();
          },
          error: (err: any) => {
            console.error(err);
            this.snackBar.open('Erreur suppression', 'Fermer', { duration: 3000 });
            this.loadingService.hide();
          }
        });
      }
    });
  }
}
