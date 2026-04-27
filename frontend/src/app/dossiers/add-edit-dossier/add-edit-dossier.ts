import { Component, Inject, OnInit } from '@angular/core';
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

import { DossierService } from '../../core/services/dossier.service';
import { BoitierService } from '../../core/services/boitier.service';
import { PhaseArchiveService } from '../../core/services/phase-archive.service';
import { Dossier } from '../../core/models/dossier.model';
import { Boitier } from '../../core/models/boitier.model';
import { PhaseArchive } from '../../core/models/phase-archive.model';

function isBoitier(obj: unknown): obj is Boitier {
  return !!obj && typeof obj === 'object' && 'id' in obj && 'idboit' in obj;
}

function isPhaseArchive(obj: unknown): obj is PhaseArchive {
  return !!obj && typeof obj === 'object' && 'id' in obj && 'nom' in obj;
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
  form: FormGroup;
  isEditMode: boolean;
  boitiers: Boitier[] = [];
  phases: PhaseArchive[] = [];

  constructor(
    private fb: FormBuilder,
    private dossierService: DossierService,
    private boitierService: BoitierService,
    private phaseService: PhaseArchiveService,
    private dialogRef: MatDialogRef<AddEditDossierComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      nomDos: ['', Validators.required],
      boitier: [null],
      phaseArchive: [null, Validators.required],
      phaseType: ['COURANTE', Validators.required],
      date_creation: ['', Validators.required],
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
    this.loadBoitiers();
    this.loadPhases();

    if (this.isEditMode && this.data.dossier) {
      const dossier = this.data.dossier;
      const patchValues: Record<string, unknown> = { ...dossier };

      if (dossier.boitier && isBoitier(dossier.boitier)) {
        patchValues['boitier'] = dossier.boitier.id;
      }

      if (dossier.phaseArchive && isPhaseArchive(dossier.phaseArchive)) {
        patchValues['phaseArchive'] = dossier.phaseArchive.id;
      }

      this.form.patchValue(patchValues);
    }
  }

  loadBoitiers(): void {
    this.boitierService.getBoitiers({ page_size: 1000 }).subscribe(res => this.boitiers = res.results);
  }

  loadPhases(): void {
    this.phaseService.getPhases({ page_size: 1000 }).subscribe(res => this.phases = res.results);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (this.isEditMode && this.data.dossier) {
      this.dossierService.updateDossier(String(this.data.dossier.idDossier), formValue).subscribe({
        next: () => {
          this.snackBar.open('Dossier modifie', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => this.snackBar.open('Erreur modification', 'Fermer', { duration: 3000 })
      });
      return;
    }

    this.dossierService.createDossier(formValue).subscribe({
      next: () => {
        this.snackBar.open('Dossier cree', 'Fermer', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => this.snackBar.open('Erreur creation', 'Fermer', { duration: 3000 })
    });
  }
}
