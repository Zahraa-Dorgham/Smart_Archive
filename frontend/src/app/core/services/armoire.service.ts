import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Armoire, ArmoireCreate, ArmoireUpdate } from '../models/armoire.model';
import { PaginatedResponse } from '../models/base.model';

@Injectable({
    providedIn: 'root'
})
export class ArmoireService {
    private endpoint = '/armoires/';

    constructor(private api: ApiService) { }

    getArmoires(params?: any): Observable<PaginatedResponse<Armoire>> {
        return this.api.get<PaginatedResponse<Armoire>>(this.endpoint, params);
    }

    getArmoire(id: string): Observable<Armoire> {
        return this.api.get<Armoire>(`${this.endpoint}${id}/`);
    }

    createArmoire(data: ArmoireCreate): Observable<Armoire> {
        return this.api.post<Armoire>(this.endpoint, data);
    }

    updateArmoire(id: string, data: ArmoireUpdate): Observable<Armoire> {
        return this.api.put<Armoire>(`${this.endpoint}${id}/`, data);
    }

    deleteArmoire(id: string): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}${id}/`);
    }

    getArmoiresBySalle(salleId: string): Observable<Armoire[]> {
        return this.api.get<Armoire[]>(`${this.endpoint}by_salle/${salleId}/`);
    }
}