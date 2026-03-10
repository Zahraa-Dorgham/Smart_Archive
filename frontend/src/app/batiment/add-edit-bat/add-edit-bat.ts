import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { BatimentService } from '../../core/services/batiment.service';
import { Batiment } from '../../core/models/batiment.model';

export interface DialogData {
  mode: 'add' | 'edit';
  batiment?: Batiment;
}

@Component({
  selector: 'app-add-edit-bat',
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
  templateUrl: './add-edit-bat.html',
  styleUrls: ['./add-edit-bat.css']
})
export class AddEditBatComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    private batimentService: BatimentService,
    public dialogRef: MatDialogRef<AddEditBatComponent>, // juste public
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { 
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      nom: ['', Validators.required],
      adresse: ['', Validators.required],
      description: [''],
      ville: ['']
     
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.batiment) {
      this.form.patchValue(this.data.batiment);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    if (this.isEditMode && this.data.batiment) {
      this.batimentService.updateBatiment(this.data.batiment.id, formValue).subscribe({
        next: () => {
          this.snackBar.open('Bâtiment modifié', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open('Erreur modification', 'Fermer', { duration: 3000 });
        }
      });
    } else {
      this.batimentService.createBatiment(formValue).subscribe({
        next: () => {
          this.snackBar.open('Bâtiment créé', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open('Erreur création', 'Fermer', { duration: 3000 });
        }
      });
    }
  }
}