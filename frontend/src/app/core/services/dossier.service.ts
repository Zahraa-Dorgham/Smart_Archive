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
        return this.api.post<Dossier>(this.endpoint, data);
    }

    updateDossier(id: string, data: DossierUpdate): Observable<Dossier> {
        return this.api.put<Dossier>(`${this.endpoint}${id}/`, data);
    }

    deleteDossier(id: string): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}${id}/`);
    }
}