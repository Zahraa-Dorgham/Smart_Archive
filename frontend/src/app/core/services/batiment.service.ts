// core/services/batiment.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Batiment, BatimentCreate, BatimentUpdate, PaginatedResponse } from '../models/batiment.model';

@Injectable({
    providedIn: 'root'
})
export class BatimentService {
    private endpoint = '/batiments/'; 

    constructor(private api: ApiService) { }

    getBatiments(params?: any): Observable<PaginatedResponse<Batiment>> {
        return this.api.get<PaginatedResponse<Batiment>>(this.endpoint, params);
    }

    getBatiment(id: string): Observable<Batiment> {
        return this.api.get<Batiment>(`${this.endpoint}${id}/`);
    }

    createBatiment(data: BatimentCreate): Observable<Batiment> {
        return this.api.post<Batiment>(this.endpoint, data);
    }

    updateBatiment(id: string, data: BatimentUpdate): Observable<Batiment> {
        return this.api.put<Batiment>(`${this.endpoint}${id}/`, data);
    }

    deleteBatiment(id: string): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}${id}/`);
    }

    exportBatiments(format: 'csv' | 'excel' | 'pdf'): Observable<Blob> {
        return this.api.get(`${this.endpoint}export/`, { format } );
    }
}