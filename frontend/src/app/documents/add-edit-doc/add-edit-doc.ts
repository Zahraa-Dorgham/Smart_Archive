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
import { finalize, forkJoin, Observable } from 'rxjs';

import { DocumentService } from '../../core/services/document.service';
import { DossierService } from '../../core/services/dossier.service';
import { PhaseArchiveService } from '../../core/services/phase-archive.service';
import { CalendrierService } from '../../core/services/calendrier.service';
import { Document, ExtractedDocumentMetadata } from '../../core/models/document.model';
import { Dossier } from '../../core/models/dossier.model';
import { PaginatedResponse } from '../../core/models/base.model';
import { PhaseArchive } from '../../core/models/phase-archive.model';
import { Calendrier } from '../../core/models/calendrier.model';
import { getApiErrorMessage } from '../../core/services/api-error-message';

function normalizePhases(phases: PhaseArchive[]): PhaseArchive[] {
  return [...phases].sort((left, right) => left.nom.localeCompare(right.nom, 'fr', { sensitivity: 'base' }));
}

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
  readonly defaultPhaseId = '1';
  form: FormGroup;
  isEditMode: boolean;
  dossiers: Dossier[] = [];
  phases: any[] = [];
  calendriers: Calendrier[] = [];
  filteredCalendriers: Calendrier[] = [];
  selectedFile: File | null = null;
  isAnalyzingFile = false;
  extractionWarnings: string[] = [];

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
      titre: ['', Validators.required],
      dossier: ['', Validators.required],
      calendrier: [null],
      phase_archive: [{ value: this.defaultPhaseId, disabled: true }],
      date_creation: [''],
      niv_confidentialite: ['INTERNE', Validators.required],
      auteur: [''],
      description: [''],
      conservation_active_period: [{ value: null, disabled: true }],
      conservation_semi_active_period: [{ value: null, disabled: true }],
      sort_final_type: [{ value: '', disabled: true }],
      sort_final_comment: [{ value: '', disabled: true }],
      sort_final_security_years: [{ value: null, disabled: true }]
    });
  }

  ngOnInit(): void {
    this.form.get('calendrier')?.valueChanges.subscribe(value => this.onCalendrierChange(value));
    this.form.get('dossier')?.valueChanges.subscribe(value => this.onDossierChange(value));

    forkJoin({
      dossiers: this.loadDossiers(),
      phases: this.loadPhases(),
      calendriers: this.loadCalendriers()
    }).subscribe({
      next: ({ dossiers, phases, calendriers }) => {
        this.dossiers = dossiers.results;
        this.phases = normalizePhases(phases.results);
        this.calendriers = calendriers.results;
        this.filteredCalendriers = [];

        if (this.isEditMode && this.data.document) {
          this.patchDocumentForm(this.data.document);
        } else {
          this.form.patchValue({ phase_archive: this.defaultPhaseId }, { emitEvent: false });
          this.onDossierChange(this.form.get('dossier')?.value ?? null);
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
    this.extractionWarnings = [];
  }

  analyzeSelectedFile(): void {
    const dossierId = this.form.get('dossier')?.value;
    if (!this.selectedFile) {
      this.snackBar.open('Ajoutez d abord un fichier a analyser.', 'Fermer', { duration: 3000 });
      return;
    }
    this.isAnalyzingFile = true;
    this.extractionWarnings = [];
    const dossierOptions = this.dossiers.map(item => ({
      idDossier: item.idDossier,
      nomDos: item.nomDos ?? null,
    }));
    this.documentService.extractDocumentMetadata(
      dossierId ? String(dossierId) : null,
      this.selectedFile,
      dossierOptions
    ).pipe(
      finalize(() => {
        this.isAnalyzingFile = false;
      })
    ).subscribe({
      next: (result) => {
        this.applyExtractedMetadata(result);
        this.snackBar.open('Champs remplis a partir du fichier.', 'Fermer', { duration: 3000 });
      },
      error: (error) => {
        const message = error?.error?.error || 'Erreur pendant l analyse du fichier';
        this.snackBar.open(message, 'Fermer', { duration: 4000 });
      }
    });
  }

  onDossierChange(dossierId: string | null): void {
    const selectedDossier = this.dossiers.find(item => String(item.idDossier) === String(dossierId));
    const allowedCalendrierIds = this.getAllowedCalendrierIds(selectedDossier);
    this.filteredCalendriers = this.calendriers.filter(item => allowedCalendrierIds.has(String(item.id)));
    const currentCalendrier = this.form.get('calendrier')?.value;
    if (currentCalendrier && !allowedCalendrierIds.has(String(currentCalendrier))) {
      this.form.patchValue({ calendrier: null }, { emitEvent: false });
    }
    if (!currentCalendrier && this.filteredCalendriers.length === 1) {
      this.form.patchValue({ calendrier: String(this.filteredCalendriers[0].id) }, { emitEvent: true });
    }
  }

  private patchDocumentForm(doc: Document): void {
    const currentCalendrier = doc.calendrier as { id?: string | number } | string | number | null | undefined;
    const currentDossier = doc.dossier as Dossier | number | string;
    const currentPhase = doc.phase_archive as { id?: string | number } | string | number | null | undefined;
    const calendrierValue = currentCalendrier && typeof currentCalendrier === 'object' ? currentCalendrier.id ?? null : currentCalendrier ?? null;
    const dossierValue = currentDossier && typeof currentDossier === 'object' ? currentDossier.idDossier : currentDossier;
    const phaseValue = currentPhase && typeof currentPhase === 'object' ? currentPhase.id ?? this.defaultPhaseId : currentPhase ?? this.defaultPhaseId;
    this.form.patchValue({
      ...doc,
      dossier: dossierValue != null ? String(dossierValue) : null,
      calendrier: calendrierValue != null ? String(calendrierValue) : null,
      phase_archive: String(phaseValue)
    }, { emitEvent: false });
    this.onDossierChange(dossierValue != null ? String(dossierValue) : null);
    this.onCalendrierChange(calendrierValue != null ? String(calendrierValue) : null);
  }

  private applyExtractedMetadata(result: ExtractedDocumentMetadata): void {
    const nextValues: Record<string, string | null> = {
      titre: result.titre,
      dossier: result.dossier,
      calendrier: result.calendrier,
      niv_confidentialite: result.niv_confidentialite,
      auteur: result.auteur,
      date_creation: result.date_creation,
      description: result.description,
      phase_archive: this.isEditMode ? (result.phase_archive || this.form.getRawValue().phase_archive || this.defaultPhaseId) : this.defaultPhaseId,
    };
    this.form.patchValue(nextValues, { emitEvent: false });
    this.extractionWarnings = result.warnings || [];
    this.onDossierChange(result.dossier);
    this.onCalendrierChange(result.calendrier);
  }

  private getAllowedCalendrierIds(dossier?: Dossier): Set<string> {
    if (!dossier?.calendrier) return new Set<string>();
    const rootId = typeof dossier.calendrier === 'object' ? dossier.calendrier.id : dossier.calendrier;
    if (!rootId) return new Set<string>();
    const allowedIds = new Set<string>([String(rootId)]);
    const pendingIds = [String(rootId)];
    while (pendingIds.length > 0) {
      const currentId = pendingIds.shift();
      if (!currentId) continue;
      const childIds = this.calendriers
        .filter(item => item.parent != null && String(item.parent) === currentId)
        .map(item => String(item.id))
        .filter(id => !allowedIds.has(id));
      childIds.forEach(id => {
        allowedIds.add(id);
        pendingIds.push(id);
      });
    }
    return allowedIds;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const rawValue = this.form.getRawValue();
    const formValue = {
      ...rawValue,
      phase_archive: this.isEditMode ? (rawValue.phase_archive || this.defaultPhaseId) : this.defaultPhaseId
    };
    if (this.isEditMode && this.data.document) {
      this.documentService.updateDocument(this.data.document.id, formValue, this.selectedFile || undefined).subscribe({
        next: () => {
          this.snackBar.open('Document modifié', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => this.snackBar.open(getApiErrorMessage(error, 'Erreur modification'), 'Fermer', { duration: 5000 })
      });
    } else {
      this.documentService.createDocument(formValue, this.selectedFile || undefined).subscribe({
        next: () => {
          this.snackBar.open('Document créé', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => this.snackBar.open(getApiErrorMessage(error, 'Erreur creation'), 'Fermer', { duration: 5000 })
      });
    }
  }
}
