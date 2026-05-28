import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { forkJoin, Observable } from 'rxjs';

import { DossierService } from '../../core/services/dossier.service';
import { BoitierService } from '../../core/services/boitier.service';
import { CalendrierService } from '../../core/services/calendrier.service';
import { PhaseArchiveService } from '../../core/services/phase-archive.service';
import { Calendrier } from '../../core/models/calendrier.model';
import { Dossier } from '../../core/models/dossier.model';
import { Boitier } from '../../core/models/boitier.model';
import { PhaseArchive } from '../../core/models/phase-archive.model';
import { PaginatedResponse } from '../../core/models/base.model';
import { getApiErrorMessage } from '../../core/services/api-error-message';

function isBoitier(obj: unknown): obj is Boitier {
  return !!obj && typeof obj === 'object' && 'id' in obj && 'idboit' in obj;
}

function isPhaseArchive(obj: unknown): obj is PhaseArchive {
  return !!obj && typeof obj === 'object' && 'id' in obj && 'nom' in obj;
}

function normalizePhases(phases: PhaseArchive[]): PhaseArchive[] {
  return [...phases].sort((left, right) => left.nom.localeCompare(right.nom, 'fr', { sensitivity: 'base' }));
}

export interface DialogData {
  mode: 'add' | 'edit';
  dossier?: Dossier;
}

@Component({
  selector: 'app-add-edit-dossier',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './add-edit-dossier.html',
  styleUrls: ['./add-edit-dossier.css']
})
export class AddEditDossierComponent implements OnInit {
  readonly defaultPhaseId = '1';
  form: FormGroup;
  isEditMode: boolean;
  boitiers: any[] = [];     // à remplir depuis un service
  calendriers: any[] = [];
  phases: PhaseArchive[] = [];
  nomDosInvalid = false;

  constructor(
    private fb: FormBuilder,
    private dossierService: DossierService,
    private boitierService: BoitierService,
    private calendrierService: CalendrierService,
    private phaseService: PhaseArchiveService,
    private dialogRef: MatDialogRef<AddEditDossierComponent>,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      code: ['', Validators.required],
      nomDos: ['', Validators.required],
      boitier: [null],
      calendrier: [null],
      phaseArchive: [{ value: this.defaultPhaseId, disabled: true }],
      phaseType: ['COURANTE'],
      date_creation: [''],
      date_cloture: [null],
      dureeCourant: [3, [Validators.required, Validators.min(0)]],
      dureeIntermediaire: [10, [Validators.required, Validators.min(0)]],
      dureeDefinitive: [100, [Validators.required, Validators.min(0)]],
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
      boitiers: this.loadBoitiers(),
      calendriers: this.loadCalendriers(),
      phases: this.loadPhases()
    }).subscribe({
      next: ({ boitiers, calendriers, phases }) => {
        this.boitiers = boitiers.results;
        this.calendriers = calendriers.results;
        this.phases = normalizePhases(phases.results);

        if (this.isEditMode && this.data.dossier) {
          this.patchDossierForm(this.data.dossier);
        } else {
          this.form.patchValue({ phaseArchive: this.defaultPhaseId }, { emitEvent: false });
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Erreur chargement des donnees du formulaire', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadBoitiers(): Observable<PaginatedResponse<Boitier>> {
    return this.boitierService.getBoitiers({ page_size: 1000 });
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

  loadPhases(): Observable<PaginatedResponse<PhaseArchive>> {
    return this.phaseService.getPhases({ page_size: 1000 });
  }

  private patchDossierForm(dossier: Dossier): void {
    const patchValues: Record<string, unknown> = { ...dossier };

    if (dossier.boitier && isBoitier(dossier.boitier)) {
      patchValues['boitier'] = String(dossier.boitier.id);
    } else if (dossier.boitier != null) {
      patchValues['boitier'] = String(dossier.boitier);
    } else {
      patchValues['boitier'] = null;
    }

    if (dossier.calendrier && typeof dossier.calendrier === 'object') {
      patchValues['calendrier'] = String(dossier.calendrier.id);
    } else if (dossier.calendrier != null) {
      patchValues['calendrier'] = String(dossier.calendrier);
    } else {
      patchValues['calendrier'] = null;
    }

    if (dossier.phaseArchive && isPhaseArchive(dossier.phaseArchive)) {
      patchValues['phaseArchive'] = String(dossier.phaseArchive.id);
    } else if (dossier.phaseArchive != null) {
      patchValues['phaseArchive'] = String(dossier.phaseArchive);
    } else {
      patchValues['phaseArchive'] = this.defaultPhaseId;
    }

    this.form.patchValue(patchValues);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const formValue = {
      ...rawValue,
      phaseArchive: this.isEditMode
        ? (rawValue.phaseArchive || this.defaultPhaseId)
        : this.defaultPhaseId
    };

    if (this.isEditMode && this.data.dossier) {
      this.dossierService.updateDossier(String(this.data.dossier.idDossier), formValue).subscribe({
        next: () => {
          this.snackBar.open('Dossier modifie', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => this.snackBar.open(getApiErrorMessage(error, 'Erreur modification'), 'Fermer', { duration: 5000 })
      });
      return;
    }

    this.dossierService.createDossier(formValue).subscribe({
      next: () => {
        this.snackBar.open('Dossier cree', 'Fermer', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => this.snackBar.open(getApiErrorMessage(error, 'Erreur creation'), 'Fermer', { duration: 5000 })
    });
  }
}
