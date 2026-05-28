import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { DirectionService } from '../../../app/core/services/direction.service';
import { Direction, DirectionCreate } from '../../core/models/direction.model';
import { getApiErrorMessage } from '../../core/services/api-error-message';

export interface DialogData {
  mode: 'add' | 'edit';
  direction?: Direction;
}

@Component({
  selector: 'app-add-edit-direction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule
  ],
  templateUrl: './add-edit-direction.html',
  styleUrls: ['./add-edit-direction.css']
})
export class AddEditDirectionComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    private directionService: DirectionService,
    public dialogRef: MatDialogRef<AddEditDirectionComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      nom: ['', Validators.required],
      code: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.direction) {
      this.form.patchValue(this.data.direction);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value as DirectionCreate;
    if (this.isEditMode && this.data.direction) {
      this.directionService.updateDirection(this.data.direction.id, formValue).subscribe({
        next: () => {
          this.snackBar.open('Direction modifiée', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.snackBar.open(getApiErrorMessage(error, 'Erreur modification'), 'Fermer', { duration: 5000 });
        }
      });
    } else {
      this.directionService.createDirection(formValue).subscribe({
        next: () => {
          this.snackBar.open('Direction créée', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.snackBar.open(getApiErrorMessage(error, 'Erreur creation'), 'Fermer', { duration: 5000 });
        }
      });
    }
  }
}
