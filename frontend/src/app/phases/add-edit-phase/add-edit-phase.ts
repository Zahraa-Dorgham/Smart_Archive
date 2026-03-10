import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { PhaseArchiveService } from '../../core/services/phase-archive.service';
import { PhaseArchive } from '../../core/models/phase-archive.model';

export interface DialogData {
  mode: 'add' | 'edit';
  phase?: PhaseArchive;
}

@Component({
  selector: 'app-add-edit-phase',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './add-edit-phase.html',
  styleUrls: ['./add-edit-phase.css']
})
export class AddEditPhaseComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    private phaseService: PhaseArchiveService,
    private dialogRef: MatDialogRef<AddEditPhaseComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      nom: ['', Validators.required],
      code: [''],
      type_phase: ['COURANTE', Validators.required],
      duree_conservation: ['', [Validators.required, Validators.min(1)]],
      description: [''],
      phase_suivante: [null],
      action_finale: ['ELIMINER', Validators.required],
      ordre: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.phase) {
      this.form.patchValue(this.data.phase);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    if (this.isEditMode && this.data.phase) {
      this.phaseService.updatePhase(this.data.phase.id, formValue).subscribe({
        next: () => {
          this.snackBar.open('Phase modifiée', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open('Erreur modification', 'Fermer', { duration: 3000 });
        }
      });
    } else {
      this.phaseService.createPhase(formValue).subscribe({
        next: () => {
          this.snackBar.open('Phase créée', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open('Erreur création', 'Fermer', { duration: 3000 });
        }
      });
    }
  }
}