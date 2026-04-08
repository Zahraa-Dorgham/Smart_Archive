// batiment/batiment.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BatimentService } from '../../../src/app/core/services/batiment.service';
import { SalleService } from '../../../src/app/core/services/salle.service';

@Component({
    selector: 'app-show-batiment',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatCardModule,
        MatButtonModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './batiment.html',
    styleUrls: ['./batiment.css']
})
export class ShowBatimentComponent implements OnInit {
    batiment: any;
    salles: any[] = [];
    isLoading = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private batimentService: BatimentService,
        private salleService: SalleService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.loadBatiment(id);
            this.loadSalles(id);
        }
    }

    loadBatiment(id: number): void {
        this.isLoading = true;
        this.batimentService.getBatiment(id.toString()).subscribe({
            next: (data: any) => { this.batiment = data; this.isLoading = false; },
            error: () => { this.isLoading = false; }
        });
    }

    loadSalles(batimentId: number): void {
        this.salleService.getSallesByBatiment(batimentId.toString()).subscribe({
            next: (data: any[]) => this.salles = data,
            error: (err: any) => console.error(err)
        });
    }

    getTypeLabel(type: string): string {
        const types: any = {
            'ARCHIVE': 'Archive',
            'CONSULTATION': 'Consultation',
            'TRI': 'Tri',
            'NUMERISATION': 'Numérisation'
        };
        return types[type] || type;
    }

    getTypeClass(type: string): string {
        switch (type) {
            case 'ARCHIVE': return 'archive';
            case 'CONSULTATION': return 'consultation';
            case 'TRI': return 'tri';
            case 'NUMERISATION': return 'numerisation';
            default: return '';
        }
    }

    goBack(): void {
        this.router.navigate(['/batiments']);
    }

    editBatiment(): void {
        this.router.navigate(['/batiments/edit', this.batiment.id]);
    }

    addSalle(): void {
        this.router.navigate(['/salles/new'], { queryParams: { batimentId: this.batiment.id } });
    }

    viewSalle(salleId: number): void {
        this.router.navigate(['/salles', salleId]);
    }
}