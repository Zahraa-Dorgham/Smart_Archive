import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { forkJoin } from 'rxjs';

import { CalendrierService } from '../../core/services/calendrier.service';
import { DirectionService } from '../../core/services/direction.service';
import { Calendrier } from '../../core/models/calendrier.model';

export interface DialogData {
  mode: 'add' | 'edit';
  calendrier?: Calendrier;
}

@Component({
  selector: 'app-add-edit-calendrier',
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
    MatCheckboxModule
  ],
  templateUrl: './add-edit-calendrier.html',
  styleUrls: ['./add-edit-calendrier.css']
})
export class AddEditCalendrierComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;
  directions: any[] = [];
  parents: any[] = [];

  constructor(
    private fb: FormBuilder,
    private calendrierService: CalendrierService,
    private directionService: DirectionService,
    private dialogRef: MatDialogRef<AddEditCalendrierComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      code: ['', Validators.required],
      title: ['', Validators.required],
      description: [''],
      unit_responsable: [''],
      parent: [null],
      is_dossier: [null, Validators.required],
      direction: [null],
      exemplaire_type: [''],
      conservation_active_period: [null],
      conservation_semi_active_period: [null],
      sort_final_type: [''],
      sort_final_comment: [''],
      sort_final_security_years: [null],
      remarques: [''],
      validation_archive: [false],
      is_active: [true]
    });
  }

  ngOnInit(): void {
    const directions$ = this.directionService.getDirections();
    const calendriers$ = this.calendrierService.getCalendriers({ page_size: 1000 });

    forkJoin({
      directions: directions$,
      calendriers: calendriers$
    }).subscribe({
      next: ({ directions, calendriers }) => {
        this.directions = directions.results || [];
        const list = calendriers.results || [];

        if (this.isEditMode && this.data.calendrier) {
          this.parents = list.filter((p: any) => String(p.id) !== String(this.data.calendrier?.id));
          
          // Patch form after data is loaded
          const c = this.data.calendrier as any;
          const patch = {
            ...c,
            parent: this.extractId(c.parent) || this.extractId(c.parent_detail),
            direction: this.extractId(c.direction) || this.extractId(c.direction_detail)
          };

          if (patch.direction) {
            patch.direction = Number(patch.direction);
          }
          this.form.patchValue(patch);
        } else {
          this.parents = list;
        }
      },
      error: (err) => {
        console.error('Error loading form data', err);
        this.snackBar.open('Erreur de chargement des données', 'Fermer', { duration: 3000 });
      }
    });
  }

  private extractId(val: any): any {
    if (!val) return null;
    if (typeof val === 'object') return val.id;
    return val;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const formValue = this.form.value;
    if (this.isEditMode && this.data.calendrier) {
      this.calendrierService.updateCalendrier(String(this.data.calendrier.id), formValue).subscribe({
        next: () => {
          this.snackBar.open('Calendrier modifié', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open('Erreur modification', 'Fermer', { duration: 3000 });
        }
      });
    } else {
      this.calendrierService.createCalendrier(formValue).subscribe({
        next: () => {
          this.snackBar.open('Calendrier créé', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open('Erreur création', 'Fermer', { duration: 3000 });
        }
      });
    }
  }
}
