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
import { MatChipsModule } from '@angular/material/chips';

import { DocumentService } from '../../core/services/document.service';
import { Document } from '../../core/models/document.model';
import { PaginatedResponse } from '../../core/models/base.model';
import { AddEditDocumentComponent } from '../add-edit-doc/add-edit-doc';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-show-document',
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
    MatChipsModule,
    AddEditDocumentComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './show-doc.html',
  styleUrls: ['./show-doc.css']
})
export class ShowDocumentComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Document>([]);
  displayedColumns: string[] = ['idDoc', 'reference', 'titre', 'dossier', 'phase', 'date', 'confidentialite', 'actions'];
  filterForm: FormGroup;

  constructor(
    private documentService: DocumentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({ search: [''] });
  }

  ngOnInit(): void {
    this.loadDocuments();
    this.filterForm.valueChanges.subscribe(() => this.applyFilter());
  }

  loadDocuments(): void {
    this.loadingService.show();
    this.documentService.getDocuments().subscribe({
      next: (response: PaginatedResponse<Document>) => {
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
    const search = this.filterForm.value.search?.toLowerCase().trim() || '';
    this.dataSource.filterPredicate = (data: Document, filter: string) => {
      return data.titre.toLowerCase().includes(filter) ||
        data.reference.toLowerCase().includes(filter) ||
        data.idDoc.toLowerCase().includes(filter);
    };
    this.dataSource.filter = search;
  }

  getDossierReference(doc: Document): string {
    if (typeof doc.dossier === 'object') {
      return doc.dossier.reference;
    }
    return (doc as any).dossier_reference || 'N/A';
  }

  getPhaseNom(doc: Document): string {
    if (typeof doc.phase_archive === 'object') {
      return doc.phase_archive.nom;
    }
    return (doc as any).phase_nom || 'N/A';
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
    const dialogRef = this.dialog.open(AddEditDocumentComponent, {
      width: '600px',
      data: { mode: 'add' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadDocuments();
    });
  }

  openEditDialog(document: Document): void {
    const dialogRef = this.dialog.open(AddEditDocumentComponent, {
      width: '600px',
      data: { mode: 'edit', document }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadDocuments();
    });
  }

  deleteDocument(document: Document): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation',
        message: `Supprimer le document ${document.reference} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.documentService.deleteDocument(document.id).subscribe({
          next: () => {
            this.snackBar.open('Document supprimé', 'Fermer', { duration: 3000 });
            this.loadDocuments();
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