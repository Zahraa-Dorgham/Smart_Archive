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

// Type guards
function isBoitier(obj: any): obj is Boitier {
  return obj && typeof obj === 'object' && 'id' in obj && 'idboit' in obj;
}

function isPhaseArchive(obj: any): obj is PhaseArchive {
  return obj && typeof obj === 'object' && 'id' in obj && 'nom' in obj;
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
  boitiers: any[] = [];
  phases: any[] = [];

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
      idDossier: ['', Validators.required],
      reference: ['', Validators.required],
      titre: ['', Validators.required],
      description: [''],
      boitier: [''],
      phase_archive: ['', Validators.required],
      date_creation: ['', Validators.required],
      date_cloture: [''],
      statut: ['ACTIF', Validators.required],
      niveau_confidentialite: ['INTERNE', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadBoitiers();
    this.loadPhases();
    if (this.isEditMode && this.data.dossier) {
      const dossier = this.data.dossier;
      const patchValues: any = { ...dossier };
      if (dossier.boitier && isBoitier(dossier.boitier)) {
        patchValues.boitier = dossier.boitier.id;
      }
      if (dossier.phase_archive && isPhaseArchive(dossier.phase_archive)) {
        patchValues.phase_archive = dossier.phase_archive.id;
      }
      this.form.patchValue(patchValues);
    }
  }

  loadBoitiers(): void {
    this.boitierService.getBoitiers().subscribe(res => this.boitiers = res.results);
  }

  loadPhases(): void {
    this.phaseService.getPhases().subscribe(res => this.phases = res.results);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const formValue = this.form.value;
    if (this.isEditMode && this.data.dossier) {
      this.dossierService.updateDossier(this.data.dossier.id, formValue).subscribe({
        next: () => {
          this.snackBar.open('Dossier modifié', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => this.snackBar.open('Erreur modification', 'Fermer', { duration: 3000 })
      });
    } else {
      this.dossierService.createDossier(formValue).subscribe({
        next: () => {
          this.snackBar.open('Dossier créé', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => this.snackBar.open('Erreur création', 'Fermer', { duration: 3000 })
      });
    }
  }
}