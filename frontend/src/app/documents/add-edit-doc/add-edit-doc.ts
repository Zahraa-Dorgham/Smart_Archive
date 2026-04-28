import { Component, Inject, OnInit } from '@angular/core';
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

import { DocumentService } from '../../core/services/document.service';
import { DossierService } from '../../core/services/dossier.service';
import { PhaseArchiveService } from '../../core/services/phase-archive.service';
import { CalendrierService } from '../../core/services/calendrier.service';
import { Document } from '../../core/models/document.model';
import { Dossier } from '../../core/models/dossier.model';

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
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      idDoc: ['', Validators.required],
      // reference: ['', Validators.required],
      titre: ['', Validators.required],
      dossier: ['', Validators.required],
      calendrier: [null],
      // phase_archive: ['', Validators.required],
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
    this.loadDossiers();
    this.loadPhases();
    this.loadCalendriers();
    this.form.get('calendrier')?.valueChanges.subscribe(value => this.onCalendrierChange(value));
    if (this.isEditMode && this.data.document) {
      const doc = this.data.document;
      const currentCalendrier = doc.calendrier as { id?: string } | string | null | undefined;
      const currentDossier = doc.dossier as Dossier | number | string;
      const calendrierValue =
        currentCalendrier && typeof currentCalendrier === 'object'
          ? currentCalendrier.id ?? null
          : currentCalendrier;
      const dossierValue =
        currentDossier && typeof currentDossier === 'object'
          ? currentDossier.idDossier
          : currentDossier;

      this.form.patchValue({
        ...doc,
        dossier: dossierValue,
        calendrier: calendrierValue,
        // phase_archive: typeof doc.phase_archive === 'object' ? doc.phase_archive.id : doc.phase_archive
      });
    }
  }

  loadDossiers(): void {
    this.dossierService.getDossiers({ page_size: 1000 }).subscribe(res => this.dossiers = res.results);
  }

  loadPhases(): void {
    this.phaseService.getPhases().subscribe(res => this.phases = res.results);
  }

  loadCalendriers(): void {
    this.calendrierService.getCalendriers({ page_size: 1000 }).subscribe(res => this.calendriers = res.results);
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
