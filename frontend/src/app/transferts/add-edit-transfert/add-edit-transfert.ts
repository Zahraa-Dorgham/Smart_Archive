import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Boitier } from '../../core/models/boitier.model';
import { Transfert } from '../../core/models/transfert.model';
import { TransfertService } from '../../core/services/transfert.service';

export interface TransfertDialogData {
  mode: 'add' | 'edit';
  transfert?: Transfert;
}

@Component({
  selector: 'app-add-edit-transfert',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  templateUrl: './add-edit-transfert.html',
  styleUrls: ['./add-edit-transfert.css']
})
export class AddEditTransfertComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;
  boitiers: Boitier[] = [];

  readonly typeOptions = ['INTERMEDIAIRE', 'FINAL'];
  readonly statusOptions = ['EN_ATTENTE', 'VALIDE', 'ANNULE', 'EXECUTE'];

  constructor(
    private fb: FormBuilder,
    private transfertService: TransfertService,
    private dialogRef: MatDialogRef<AddEditTransfertComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: TransfertDialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      reference: [''],
      bordereauxReference: [''],
      typeTransfer: ['INTERMEDIAIRE', Validators.required],
      statut: ['EN_ATTENTE', Validators.required],
      date_demande: [new Date(), Validators.required],
      date_execution: [null],
      boitier_ids: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadBoitiers();

    if (this.isEditMode && this.data.transfert) {
      this.form.patchValue({
        reference: this.data.transfert.reference ?? '',
        bordereauxReference: this.data.transfert.bordereauxReference ?? '',
        typeTransfer: this.data.transfert.typeTransfer ?? 'INTERMEDIAIRE',
        statut: this.data.transfert.statut ?? 'EN_ATTENTE',
        date_demande: this.data.transfert.date_demande ? new Date(this.data.transfert.date_demande) : new Date(),
        date_execution: this.data.transfert.date_execution ? new Date(this.data.transfert.date_execution) : null,
        boitier_ids: this.data.transfert.boitier_ids ?? []
      });
    }
  }

  loadBoitiers(): void {
    const transfertId = this.isEditMode && this.data.transfert ? String(this.data.transfert.id) : undefined;

    this.transfertService.getAvailableBoitiers(transfertId).subscribe({
      next: (response) => {
        this.boitiers = response;
      },
      error: () => {
        this.snackBar.open('Erreur chargement des boitiers', 'Fermer', { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();

    if (this.isEditMode && this.data.transfert) {
      this.transfertService.updateTransfert(String(this.data.transfert.id), payload).subscribe({
        next: () => {
          this.snackBar.open('Transfert modifie', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => this.snackBar.open('Erreur modification', 'Fermer', { duration: 3000 })
      });
      return;
    }

    this.transfertService.createTransfert(payload).subscribe({
      next: () => {
        this.snackBar.open('Transfert cree', 'Fermer', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => this.snackBar.open('Erreur creation', 'Fermer', { duration: 3000 })
    });
  }
}
