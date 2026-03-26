import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Boitier, BoitierCreate, BoitierUpdate } from '../models/boitier.model';
import { PaginatedResponse } from '../models/base.model';

@Injectable({
    providedIn: 'root'
})
export class BoitierService {
    private endpoint = '/boitiers/';

    constructor(private api: ApiService) { }

    getBoitiers(params?: any): Observable<PaginatedResponse<Boitier>> {
        return this.api.get<PaginatedResponse<Boitier>>(this.endpoint, params);
    }

    getBoitier(id: string): Observable<Boitier> {
        return this.api.get<Boitier>(`${this.endpoint}${id}/`);
    }

    createBoitier(data: BoitierCreate): Observable<Boitier> {
        return this.api.post<Boitier>(this.endpoint, data);
    }

    updateBoitier(id: string, data: BoitierUpdate): Observable<Boitier> {
        return this.api.put<Boitier>(`${this.endpoint}${id}/`, data);
    }

    deleteBoitier(id: string): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}${id}/`);
    }
}