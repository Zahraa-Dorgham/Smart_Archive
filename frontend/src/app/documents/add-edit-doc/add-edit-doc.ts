import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, Observable } from 'rxjs';

import { DocumentService } from '../../core/services/document.service';
import { DossierService } from '../../core/services/dossier.service';
import { PhaseArchiveService } from '../../core/services/phase-archive.service';
import { CalendrierService } from '../../core/services/calendrier.service';
import { Document } from '../../core/models/document.model';
import { Dossier } from '../../core/models/dossier.model';
import { PaginatedResponse } from '../../core/models/base.model';
import { PhaseArchive } from '../../core/models/phase-archive.model';
import { Calendrier } from '../../core/models/calendrier.model';

export interface DialogData {
  mode: 'add' | 'edit';
  document?: Document;
}

@Component({
  selector: 'app-add-edit-document',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  templateUrl: './add-edit-doc.html',
  styleUrls: ['./add-edit-doc.css']
})
export class AddEditDocumentComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;
  dossiers: Dossier[] = [];
  phases: any[] = [];
  calendriers: any[] = [];
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentService,
    private dossierService: DossierService,
    private phaseService: PhaseArchiveService,
    private calendrierService: CalendrierService,
    private dialogRef: MatDialogRef<AddEditDocumentComponent>,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      idDoc: ['', Validators.required],
      // reference: ['', Validators.required],
      titre: ['', Validators.required],
      dossier: ['', Validators.required],
      calendrier: [null],
      phase_archive: [null],
      date_creation: [''],
      niv_confidentialite: ['INTERNE', Validators.required],
      // type_document: ['AUTRE', Validators.required],
      auteur: [''],
      description: [''],
      conservation_active_period: [null],
      conservation_semi_active_period: [null],
      sort_final_type: [''],
      sort_final_comment: [''],
      sort_final_security_years: [null]
    });
  }

  ngOnInit(): void {
    this.form.get('calendrier')?.valueChanges.subscribe(value => this.onCalendrierChange(value));

    forkJoin({
      dossiers: this.loadDossiers(),
      phases: this.loadPhases(),
      calendriers: this.loadCalendriers()
    }).subscribe({
      next: ({ dossiers, phases, calendriers }) => {
        this.dossiers = dossiers.results;
        this.phases = phases.results;
        this.calendriers = calendriers.results;

        if (this.isEditMode && this.data.document) {
          this.patchDocumentForm(this.data.document);
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Erreur chargement des donnees du formulaire', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadDossiers(): Observable<PaginatedResponse<Dossier>> {
    return this.dossierService.getDossiers({ page_size: 1000 });
  }

  loadPhases(): Observable<PaginatedResponse<PhaseArchive>> {
    return this.phaseService.getPhases({ page_size: 1000 });
  }

  loadCalendriers(): Observable<PaginatedResponse<Calendrier>> {
    return this.calendrierService.getCalendriers({ page_size: 1000 });
  }

  onCalendrierChange(calendrierId: string | null): void {
    if (!calendrierId) {
      return;
    }

    const calendrier = this.calendriers.find(item => String(item.id) === String(calendrierId));
    if (!calendrier) {
      return;
    }

    this.form.patchValue({
      conservation_active_period: calendrier.conservation_active_period ?? null,
      conservation_semi_active_period: calendrier.conservation_semi_active_period ?? null,
      sort_final_type: calendrier.sort_final_type ?? '',
      sort_final_comment: calendrier.sort_final_comment ?? '',
      sort_final_security_years: calendrier.sort_final_security_years ?? null
    }, { emitEvent: false });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  private patchDocumentForm(doc: Document): void {
    const currentCalendrier = doc.calendrier as { id?: string | number } | string | number | null | undefined;
    const currentDossier = doc.dossier as Dossier | number | string;
    const currentPhase = doc.phase_archive as { id?: string | number } | string | number | null | undefined;

    const calendrierValue =
      currentCalendrier && typeof currentCalendrier === 'object'
        ? currentCalendrier.id ?? null
        : currentCalendrier ?? null;
    const dossierValue =
      currentDossier && typeof currentDossier === 'object'
        ? currentDossier.idDossier
        : currentDossier;
    const phaseValue =
      currentPhase && typeof currentPhase === 'object'
        ? currentPhase.id ?? null
        : currentPhase ?? null;

    this.form.patchValue({
      ...doc,
      dossier: dossierValue != null ? String(dossierValue) : null,
      calendrier: calendrierValue != null ? String(calendrierValue) : null,
      phase_archive: phaseValue != null ? String(phaseValue) : null
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    if (this.isEditMode && this.data.document) {
      this.documentService.updateDocument(this.data.document.id, formValue, this.selectedFile || undefined).subscribe({
        next: () => {
          this.snackBar.open('Document modifié', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => this.snackBar.open('Erreur modification', 'Fermer', { duration: 3000 })
      });
    } else {
      this.documentService.createDocument(formValue, this.selectedFile || undefined).subscribe({
        next: () => {
          this.snackBar.open('Document créé', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => this.snackBar.open('Erreur création', 'Fermer', { duration: 3000 })
      });
    }
  }
}
