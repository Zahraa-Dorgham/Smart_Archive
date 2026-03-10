import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { SalleService } from '../../core/services/salle.service';
import { Salle } from '../../core/models/salle.model';

export interface DialogData {
  mode: 'add' | 'edit';
  salle?: Salle;
  batiments: any[];
}

@Component({
  selector: 'app-add-edit-salle',
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
  templateUrl: './add-edit-salle.html',
  styleUrls: ['./add-edit-salle.css']
})
export class AddEditSalleComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    private salleService: SalleService,
    private dialogRef: MatDialogRef<AddEditSalleComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      nom: ['', Validators.required],
      code: ['', Validators.required],
      batiment: ['', Validators.required],
      type_salle: ['ARCHIVE', Validators.required],
      etage: [0, Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.salle) {
      this.form.patchValue(this.data.salle);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    if (this.isEditMode && this.data.salle) {
      this.salleService.updateSalle(this.data.salle.id, formValue).subscribe({
        next: () => {
          this.snackBar.open('Salle modifiée', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
      });
    } else {
      this.salleService.createSalle(formValue).subscribe({
        next: () => {
          this.snackBar.open('Salle créée', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
      });
    }
  }
}