import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { EtagereService } from '../../core/services/etagere.service';
import { ArmoireService } from '../../core/services/armoire.service';
import { Etagere } from '../../core/models/etagere.model';

export interface DialogData {
  mode: 'add' | 'edit';
  etagere?: Etagere;
}

@Component({
  selector: 'app-add-edit-etagere',
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
  templateUrl: './add-edit-etagere.html',
  styleUrls: ['./add-edit-etagere.css']
})
export class AddEditEtagereComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;
  armoires: any[] = [];

  constructor(
    private fb: FormBuilder,
    private etagereService: EtagereService,
    private armoireService: ArmoireService,
    private dialogRef: MatDialogRef<AddEditEtagereComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      armoire: ['', Validators.required],
      numero: ['', [Validators.required, Validators.min(1)]],
      code_barres: [''],
      capacite_max_boites: [10, [Validators.required, Validators.min(1)]],
      occupation_actuelle: [0, [Validators.min(0)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadArmoires();
    if (this.isEditMode && this.data.etagere) {
      this.form.patchValue({
        ...this.data.etagere,
        armoire: typeof this.data.etagere.armoire === 'object' ? this.data.etagere.armoire.id : this.data.etagere.armoire
      });
    }
  }

  loadArmoires(): void {
    this.armoireService.getArmoires().subscribe({
      next: (res) => {
        this.armoires = res.results;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    if (this.isEditMode && this.data.etagere) {
      this.etagereService.updateEtagere(this.data.etagere.id, formValue).subscribe({
        next: () => {
          this.snackBar.open('Étagère modifiée', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open('Erreur modification', 'Fermer', { duration: 3000 });
        }
      });
    } else {
      this.etagereService.createEtagere(formValue).subscribe({
        next: () => {
          this.snackBar.open('Étagère créée', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open('Erreur création', 'Fermer', { duration: 3000 });
        }
      });
    }
  }
}