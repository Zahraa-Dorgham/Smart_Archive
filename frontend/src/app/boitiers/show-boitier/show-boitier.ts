import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ChangeDetectorRef } from "@angular/core";

import { BoitierService } from '../../core/services/boitier.service';
import { EtagereService } from '../../core/services/etagere.service';
import { Boitier } from '../../core/models/boitier.model';
import { Armoire } from '../../core/models/armoire.model';
import { Etagere } from '../../core/models/etagere.model';
import { PaginatedResponse } from '../../core/models/base.model';
import { AddEditBoitierComponent } from '../add-edit-boitier/add-edit-boitier';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { LoadingService } from '../../core/services/loading.service';

// Type guards pour vérifier si un objet est une instance d'Armoire ou d'Etagere
function isArmoire(obj: any): obj is Armoire {
    return obj && typeof obj === 'object' && 'id' in obj && 'code' in obj;
}

function isEtagere(obj: any): obj is Etagere {
    return obj && typeof obj === 'object' && 'id' in obj && 'numero' in obj;
}

@Component({
    selector: 'app-show-boitier',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatCardModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatSelectModule,
        MatChipsModule,
        MatProgressBarModule,
        AddEditBoitierComponent,
        ConfirmDialogComponent
    ],
    templateUrl: './show-boitier.html',
    styleUrls: ['./show-boitier.css']
})
export class ShowBoitierComponent implements OnInit {
    @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
        if (paginator) {
            this.dataSource.paginator = paginator;
        }
    }
    @ViewChild(MatSort) set sort(sort: MatSort) {
        if (sort) {
            this.dataSource.sort = sort;
        }
    }

    dataSource = new MatTableDataSource<Boitier>([]);
    displayedColumns: string[] = ['idboit', 'titre', 'code_barre', 'localisation'];
    filterForm: FormGroup;
    etageres: any[] = [];

    constructor(
        private boitierService: BoitierService,
        private etagereService: EtagereService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private loadingService: LoadingService,
        private fb: FormBuilder,
        private cdr: ChangeDetectorRef
    ) {
        this.filterForm = this.fb.group({ 
            search: [''],
            etagere: ['']
        });
    }

    ngOnInit(): void {
        this.loadEtageres();
        this.loadBoitiers();
        this.filterForm.valueChanges.subscribe(() => this.applyFilter());
    }

    loadEtageres(): void {
        this.etagereService.getEtageres().subscribe({
            next: (res) => {
                this.etageres = res.results;
            }
        });
    }

    loadBoitiers(): void {
        this.loadingService.show();
        this.boitierService.getBoitiers().subscribe({
            next: (response) => {
                this.dataSource.data = response.results;
                this.cdr.detectChanges();
                this.loadingService.hide();
            },
            error: (err) => {
                console.error(err);
                this.loadingService.hide();
            }
        });
    }

    applyFilter(): void {
        const filter = this.filterForm.value;
        this.dataSource.filterPredicate = (data: Boitier, filterStr: string) => {
            const searchTerm = filter.search?.toLowerCase().trim() || '';
            const searchMatch = !searchTerm || 
                data.idboit.toLowerCase().includes(searchTerm) ||
                data.titre.toLowerCase().includes(searchTerm) ||
                !!(data.code_barre && data.code_barre.toLowerCase().includes(searchTerm));
            
            // Use == for loose comparison (string from select vs number from API)
            const etagereMatch = !filter.etagere || data.etagere == filter.etagere;
            
            return !!(searchMatch && etagereMatch);
        };
        this.dataSource.filter = JSON.stringify(filter);
    }

    getLocalisation(boitier: Boitier): string {
        if (boitier.armoire && boitier.etagere) {
            // Utilisation des type guards pour accéder aux propriétés
            const armoireCode = isArmoire(boitier.armoire) ? boitier.armoire.code : boitier.armoire;
            const etagereNumero = isEtagere(boitier.etagere) ? `Étagère ${boitier.etagere.numero}` : boitier.etagere;
            return `${armoireCode} / ${etagereNumero}`;
        }
        return 'Non localisé';
    }

    getEtagereLabel(etagere: any): string {
        if (etagere.armoire_code) {
            return `${etagere.armoire_code} / Niveau ${etagere.numero}`;
        }
        return `Étagère n°${etagere.numero}`;
    }

    getTaux(boitier: Boitier): number {
        return 0;
    }

    getStatutColor(statut: string): string {
        switch (statut) {
            case 'ACTIF': return 'primary';
            case 'PLEIN': return 'accent';
            case 'ARCHIVE': return '';
            case 'EN_TRANSFERT': return 'warn';
            default: return '';
        }
    }

    openAddDialog(): void {
        const dialogRef = this.dialog.open(AddEditBoitierComponent, {
            width: '600px',
            data: { mode: 'add' }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.loadBoitiers();
        });
    }

    openEditDialog(boitier: Boitier): void {
        const dialogRef = this.dialog.open(AddEditBoitierComponent, {
            width: '600px',
            data: { mode: 'edit', boitier }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.loadBoitiers();
        });
    }

    deleteBoitier(boitier: Boitier): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Confirmation',
                message: `Supprimer le boîtier ${boitier.idboit} ?`,
                confirmText: 'Supprimer',
                cancelText: 'Annuler'
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadingService.show();
                this.boitierService.deleteBoitier(boitier.id).subscribe({
                    next: () => {
                        this.snackBar.open('Boîtier supprimé', 'Fermer', { duration: 3000 });
                        this.loadBoitiers();
                    },
                    error: (err) => {
                        this.snackBar.open('Erreur suppression', 'Fermer', { duration: 3000 });
                        this.loadingService.hide();
                    }
                });
            }
        });
    }
}