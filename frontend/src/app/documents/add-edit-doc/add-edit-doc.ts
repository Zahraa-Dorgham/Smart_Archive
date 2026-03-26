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
import { Document } from '../../core/models/document.model';

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
  dossiers: any[] = [];
  phases: any[] = [];
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentService,
    private dossierService: DossierService,
    private phaseService: PhaseArchiveService,
    private dialogRef: MatDialogRef<AddEditDocumentComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      idDoc: ['', Validators.required],
      reference: ['', Validators.required],
      titre: ['', Validators.required],
      dossier: ['', Validators.required],
      phase_archive: ['', Validators.required],
      date_creation: ['', Validators.required],
      niv_confidentialite: ['INTERNE', Validators.required],
      type_document: ['AUTRE', Validators.required],
      auteur: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadDossiers();
    this.loadPhases();
    if (this.isEditMode && this.data.document) {
      const doc = this.data.document;
      this.form.patchValue({
        ...doc,
        dossier: typeof doc.dossier === 'object' ? doc.dossier.id : doc.dossier,
        phase_archive: typeof doc.phase_archive === 'object' ? doc.phase_archive.id : doc.phase_archive
      });
    }
  }

  loadDossiers(): void {
    this.dossierService.getDossiers().subscribe(res => this.dossiers = res.results);
  }

  loadPhases(): void {
    this.phaseService.getPhases().subscribe(res => this.phases = res.results);
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  onSubmit(): void {
    if (this.form.invalid) return;

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