import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
import { getApiErrorMessage } from '../../core/services/api-error-message';

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

  dataSource = new MatTableDataSource<Document>([]);
  displayedColumns: string[] = ['idDoc', 'titre', 'dossier', 'calendrier', 'phase', 'date', 'confidentialite', 'actions'];
  filterForm: FormGroup;
  dossierFilter: string | null = null;

  constructor(
    private documentService: DocumentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({ search: [''] });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.dossierFilter = params['dossier'] || null;
      this.loadDocuments();
    });
    this.filterForm.valueChanges.subscribe(() => this.applyFilter());
  }

  loadDocuments(): void {
    this.loadingService.show();
    const params: any = { page_size: 1000 };
    if (this.dossierFilter) {
      params.dossier = this.dossierFilter;
    }
    this.documentService.getDocuments(params).subscribe({
      next: (response: PaginatedResponse<Document>) => {
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
    const search = this.filterForm.value.search?.toLowerCase().trim() || '';
    this.dataSource.filterPredicate = (data: Document, filter: string) => {
      return data.titre.toLowerCase().includes(filter) ||
        // data.reference.toLowerCase().includes(filter) ||
        data.idDoc.toLowerCase().includes(filter);
    };
    this.dataSource.filter = search;
  }

  getDossierReference(doc: Document): string {
    if (typeof doc.dossier === 'object') {
      return doc.dossier.nomDos || String(doc.dossier.idDossier);
    }
    return (doc as any).dossier_nom || (doc as any).dossier_reference || 'N/A';
  }

  openLocationDialog(doc: Document): void {
    const emplacement = doc.emplacement || 'Non localise';
    const boitier = doc.boitier_idboit
      ? `${doc.boitier_idboit}${doc.boitier_titre ? ' - ' + doc.boitier_titre : ''}`
      : 'Aucun boitier associe';

    (window as any).Swal.fire({
      title: 'Emplacement du document',
      html: `
        <div class="document-location-dialog">
          <div class="location-row">
            <span class="location-label">Document</span>
            <span class="location-value">${this.escapeHtml(doc.idDoc)} - ${this.escapeHtml(doc.titre)}</span>
          </div>
          <div class="location-row">
            <span class="location-label">Dossier</span>
            <span class="location-value">${this.escapeHtml(this.getDossierReference(doc))}</span>
          </div>
          <div class="location-row">
            <span class="location-label">Boitier</span>
            <span class="location-value">${this.escapeHtml(boitier)}</span>
          </div>
          <div class="location-box">
            <i class="bx bx-map-pin"></i>
            <span>${this.escapeHtml(emplacement)}</span>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Fermer',
      confirmButtonColor: '#5a8dee'
    });
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // getPhaseNom(doc: Document): string {
  //   if (typeof doc.phase_archive === 'object') {
  //     return doc.phase_archive.nom;
  //   }
  //   return (doc as any).phase_nom || 'N/A';
  // }

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
      width: '90vw',
      maxWidth: '700px',
      maxHeight: '90vh',
      data: { 
        mode: 'add',
        dossierId: this.dossierFilter
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadDocuments();
    });
  }

  openEditDialog(document: Document): void {
    const dialogRef = this.dialog.open(AddEditDocumentComponent, {
      width: '90vw',
      maxWidth: '700px',
      maxHeight: '90vh',
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
        // message: `Supprimer le document ${document.reference} ?`,
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
          error: (error) => {
            this.snackBar.open(getApiErrorMessage(error, 'Erreur suppression'), 'Fermer', { duration: 5000 });
            this.loadingService.hide();
          }
        });
      }
    });
  }
}
