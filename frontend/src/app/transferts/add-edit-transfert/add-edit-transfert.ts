import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Boitier } from '../../core/models/boitier.model';
import { BlockingTransferPayload, Transfert } from '../../core/models/transfert.model';
import { TransfertService } from '../../core/services/transfert.service';
import { BlockingTransferDialogComponent } from '../blocking-transfer-dialog/blocking-transfer-dialog';

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
    MatSelectModule,
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
  searchTerm: string = '';

  constructor(
    private fb: FormBuilder,
    private transfertService: TransfertService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<AddEditTransfertComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: TransfertDialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      reference: [''],
      typeTransfer: ['INTERMEDIAIRE', Validators.required],
      date_demande: [this.formatDate(new Date()), Validators.required],
      boitier_ids: [[], Validators.required]
    });
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.transfert) {
      this.form.patchValue({
        reference: this.data.transfert.reference ?? '',
        typeTransfer: this.data.transfert.typeTransfer ?? 'INTERMEDIAIRE',
        date_demande: this.formatDate(this.data.transfert.date_demande),
        boitier_ids: (this.data.transfert.boitier_ids ?? []).map(id => String(id))
      });
    }

    this.form.get('typeTransfer')?.valueChanges.subscribe(() => {
      this.loadBoitiers();
    });

    this.loadBoitiers();
  }

  get filteredBoitiers(): Boitier[] {
    if (!this.searchTerm) return this.boitiers;
    const term = this.searchTerm.toLowerCase();
    return this.boitiers.filter(b =>
      b.idboit.toLowerCase().includes(term) ||
      b.titre.toLowerCase().includes(term)
    );
  }

  getSelectedBoitiers(): Boitier[] {
    const selectedIds = new Set(this.form.get('boitier_ids')?.value || []);
    return this.boitiers.filter(b => selectedIds.has(String(b.id)));
  }

  removeBoitier(id: number | string): void {
    const current = this.form.get('boitier_ids')?.value as string[];
    const updated = current.filter(item => item !== String(id));
    this.form.patchValue({ boitier_ids: updated });
  }

  loadBoitiers(): void {
    const transfertId = this.isEditMode && this.data.transfert ? String(this.data.transfert.id) : undefined;
    const typeTransfer = this.form.get('typeTransfer')?.value || 'INTERMEDIAIRE';

    this.transfertService.getAvailableBoitiers(typeTransfer, transfertId).subscribe({
      next: (response) => {
        this.boitiers = response;
        const allowedIds = new Set(response.map((item: Boitier) => String(item.id)));
        const currentSelection = ((this.form.get('boitier_ids')?.value || []) as Array<string | number>).map(id => String(id));
        const filteredSelection = currentSelection.filter(id => allowedIds.has(id));

        this.form.patchValue({ boitier_ids: filteredSelection }, { emitEvent: false });
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

    const formValue = this.form.getRawValue();
    const payload = {
      ...formValue,
      boitier_ids: (formValue.boitier_ids || []).map((id: string | number) => Number(id))
    };

    if (this.isEditMode && this.data.transfert) {
      this.transfertService.updateTransfert(String(this.data.transfert.id), payload).subscribe({
        next: () => {
          this.snackBar.open('Transfert modifie', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => this.handleSubmitError(error, 'Erreur modification')
      });
      return;
    }

    this.transfertService.createTransfert(payload).subscribe({
      next: () => {
        this.snackBar.open('Transfert cree', 'Fermer', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => this.handleSubmitError(error, 'Erreur creation')
    });
  }

  private handleSubmitError(error: any, fallbackMessage: string): void {
    const responseBody = error?.error;
    const blockingPayload =
      responseBody?.errors?.blocking_transfer ||
      responseBody?.blocking_transfer ||
      responseBody?.errors?.non_field_errors?.[0]?.blocking_transfer ||
      responseBody?.non_field_errors?.[0]?.blocking_transfer as BlockingTransferPayload | undefined;

    if (blockingPayload?.boitiers?.length) {
      this.dialog.open(BlockingTransferDialogComponent, {
        width: '850px',
        maxWidth: '95vw',
        data: blockingPayload
      });
      return;
    }

    const firstError =
      responseBody?.errors?.boitier_ids?.[0] ||
      responseBody?.boitier_ids?.[0] ||
      responseBody?.errors?.typeTransfer?.[0] ||
      responseBody?.typeTransfer?.[0];

    this.snackBar.open(firstError || fallbackMessage, 'Fermer', { duration: 4000 });
  }
}
