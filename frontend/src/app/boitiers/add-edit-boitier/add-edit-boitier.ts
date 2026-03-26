import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { BoitierService } from '../../core/services/boitier.service';
import { ArmoireService } from '../../core/services/armoire.service';
import { EtagereService } from '../../core/services/etagere.service';
import { Boitier } from '../../core/models/boitier.model';

export interface DialogData {
  mode: 'add' | 'edit';
  boitier?: Boitier;
}

@Component({
  selector: 'app-add-edit-boitier',
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
  templateUrl: './add-edit-boitier.html',
  styleUrls: ['./add-edit-boitier.css']
})
export class AddEditBoitierComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;
  armoires: any[] = [];
  etageres: any[] = [];

  constructor(
    private fb: FormBuilder,
    private boitierService: BoitierService,
    private armoireService: ArmoireService,
    private etagereService: EtagereService,
    private dialogRef: MatDialogRef<AddEditBoitierComponent>,
    private snackBar: MatSnackBar,
    
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      idboit: ['', Validators.required],
      code_barre: ['', Validators.required],
      titre: ['', Validators.required],
      capacite: [10, [Validators.required, Validators.min(1)]],
      armoire: [''],
      etagere: [''],
      statut: ['ACTIF', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadArmoires();
    if (this.isEditMode && this.data.boitier) {
      const boitier = this.data.boitier;
      const patchValue: any = {
        ...boitier
      };
      if (boitier.armoire && typeof boitier.armoire === 'object') {
        patchValue.armoire = (boitier.armoire as any).id;
      }
      if (boitier.etagere && typeof boitier.etagere === 'object') {
        patchValue.etagere = (boitier.etagere as any).id;
      }
      this.form.patchValue(patchValue);
      if (boitier.armoire) {
        const armoireId = typeof boitier.armoire === 'object' ? (boitier.armoire as any).id : boitier.armoire;
        this.loadEtageres(armoireId);
      }
    }
    this.form.get('armoire')?.valueChanges.subscribe(armoireId => {
      this.form.patchValue({ etagere: '' });
      this.loadEtageres(armoireId);
    });
  }

  loadArmoires(): void {
    this.armoireService.getArmoires().subscribe(res => this.armoires = res.results);
  }

  loadEtageres(armoireId?: string): void {
    if (!armoireId) {
      this.etageres = [];
      return;
    }
    this.etagereService.getEtageres({ armoire: armoireId }).subscribe(res => this.etageres = res.results);
  }


  onSubmit(): void {
    if (this.form.invalid) return;
    const formValue = this.form.value;
    if (this.isEditMode && this.data.boitier) {
      this.boitierService.updateBoitier(this.data.boitier.id, formValue).subscribe({
        next: () => {
          this.snackBar.open('Boîtier modifié', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => this.snackBar.open('Erreur modification', 'Fermer', { duration: 3000 })
      });
    } else {
      this.boitierService.createBoitier(formValue).subscribe({
        next: () => {
          this.snackBar.open('Boîtier créé', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => this.snackBar.open('Erreur création', 'Fermer', { duration: 3000 })
      });
    }
  }
}