import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Dossier, DossierCreate, DossierUpdate } from '../models/dossier.model';
import { PaginatedResponse } from '../models/base.model';

@Injectable({
    providedIn: 'root'
})
export class DossierService {
    private endpoint = '/dossiers/';

    constructor(private api: ApiService) { }

    getDossiers(params?: any): Observable<PaginatedResponse<Dossier>> {
        return this.api.get<PaginatedResponse<Dossier>>(this.endpoint, params);
    }

    getDossier(id: string): Observable<Dossier> {
        return this.api.get<Dossier>(`${this.endpoint}${id}/`);
    }

    createDossier(data: DossierCreate): Observable<Dossier> {
        return this.api.post<Dossier>(this.endpoint, this.serializeDossierPayload(data));
    }

    updateDossier(id: string, data: DossierUpdate): Observable<Dossier> {
        return this.api.put<Dossier>(`${this.endpoint}${id}/`, this.serializeDossierPayload(data));
    }

    deleteDossier(id: string): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}${id}/`);
    }

    private serializeDossierPayload(data: DossierCreate | DossierUpdate): Record<string, unknown> {
        const payload: Record<string, unknown> = {};

        Object.entries(data).forEach(([key, value]) => {
            if (key === 'idDossier' || value === undefined) {
                return;
            }

            if (value instanceof Date) {
                payload[key] = value.toISOString().split('T')[0];
                return;
            }

            if (value === '') {
                payload[key] = null;
                return;
            }

            payload[key] = value;
        });

        return payload;
    }
}
