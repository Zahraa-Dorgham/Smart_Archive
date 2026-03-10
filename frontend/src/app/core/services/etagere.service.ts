import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Etagere, EtagereCreate, EtagereUpdate } from '../models/etagere.model';
import { PaginatedResponse } from '../models/base.model';

@Injectable({
    providedIn: 'root'
})
export class EtagereService {
    private endpoint = '/etageres/';

    constructor(private api: ApiService) { }

    getEtageres(params?: any): Observable<PaginatedResponse<Etagere>> {
        return this.api.get<PaginatedResponse<Etagere>>(this.endpoint, params);
    }

    getEtagere(id: string): Observable<Etagere> {
        return this.api.get<Etagere>(`${this.endpoint}${id}/`);
    }

    createEtagere(data: EtagereCreate): Observable<Etagere> {
        return this.api.post<Etagere>(this.endpoint, data);
    }

    updateEtagere(id: string, data: EtagereUpdate): Observable<Etagere> {
        return this.api.put<Etagere>(`${this.endpoint}${id}/`, data);
    }

    deleteEtagere(id: string): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}${id}/`);
    }
}