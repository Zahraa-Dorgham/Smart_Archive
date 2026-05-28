import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { ArmoireService } from '../../core/services/armoire.service';
import { SalleService } from '../../core/services/salle.service';
import { Armoire } from '../../core/models/armoire.model';
import { getApiErrorMessage } from '../../core/services/api-error-message';

export interface DialogData {
  mode: 'add' | 'edit';
  armoire?: Armoire;
  salles: any[];
  initialData?: any;
}

@Component({
  selector: 'app-add-edit-armoire',
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
  templateUrl: './add-edit-armoire.html',
  styleUrls: ['./add-edit-armoire.css']
})
export class AddEditArmoireComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;
  salles: any[] = [];

  constructor(
    private fb: FormBuilder,
    private armoireService: ArmoireService,
    private salleService: SalleService,
    private dialogRef: MatDialogRef<AddEditArmoireComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      code: ['', Validators.required],
      type_armoire: ['METAL', Validators.required],
      salle: ['', Validators.required],
      code_barres: [''],
      description: [''],
      date_installation: ['']
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.armoire) {
      setTimeout(() => {
        if (this.data.armoire) {
          this.form.patchValue({
            ...this.data.armoire,
            salle: typeof this.data.armoire.salle === 'object' ? this.data.armoire.salle?.id : this.data.armoire.salle
          });
        }
      });
    } else if (this.data.initialData) {
      this.form.patchValue(this.data.initialData);
    }
  }

  loadSalles(): void {
    this.salleService.getSalles().subscribe({
      next: (res) => {
        this.salles = res.results;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const formValue = { ...this.form.value };
    // Convert empty strings to null for backend compatibility
    if (formValue.date_installation === '') formValue.date_installation = null;
    if (formValue.description === '') formValue.description = null;
    if (formValue.code_barres === '') formValue.code_barres = null;

    if (this.isEditMode && this.data.armoire) {
      this.armoireService.updateArmoire(this.data.armoire.id, formValue).subscribe({
        next: () => {
          this.snackBar.open('Armoire modifiée', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open(getApiErrorMessage(err, 'Erreur modification'), 'Fermer', { duration: 5000 });
        }
      });
    } else {
      this.armoireService.createArmoire(formValue).subscribe({
        next: () => {
          this.snackBar.open('Armoire créée', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open(getApiErrorMessage(err, 'Erreur creation'), 'Fermer', { duration: 5000 });
        }
      });
    }
  }
}
