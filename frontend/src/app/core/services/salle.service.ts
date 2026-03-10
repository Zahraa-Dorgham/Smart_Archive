import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Salle, SalleCreate, SalleUpdate } from '../models/salle.model';
import { PaginatedResponse } from '../models/base.model';  

@Injectable({
    providedIn: 'root'
})
export class SalleService {
    private endpoint = '/salles/';

    constructor(private api: ApiService) { }

    getSalles(params?: any): Observable<PaginatedResponse<Salle>> {
        return this.api.get<PaginatedResponse<Salle>>(this.endpoint, params);
    }


    getSalle(id: string): Observable<Salle> {
        return this.api.get<Salle>(`${this.endpoint}${id}/`);
    }

    createSalle(data: SalleCreate): Observable<Salle> {
        return this.api.post<Salle>(this.endpoint, data);
    }

    updateSalle(id: string, data: SalleUpdate): Observable<Salle> {
        return this.api.put<Salle>(`${this.endpoint}${id}/`, data);
    }

    deleteSalle(id: string): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}${id}/`);
    }
}