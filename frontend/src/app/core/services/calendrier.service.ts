import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Calendrier, CalendrierCreate, CalendrierUpdate } from '../models/calendrier.model';
import { PaginatedResponse } from '../models/base.model';

@Injectable({
    providedIn: 'root'
})
export class CalendrierService {
    private endpoint = '/calendrier/calendriers/';

    constructor(private api: ApiService) { }

    getCalendriers(params?: any): Observable<PaginatedResponse<Calendrier>> {
        return this.api.get<PaginatedResponse<Calendrier>>(this.endpoint, params);
    }

    getCalendrier(id: string): Observable<Calendrier> {
        return this.api.get<Calendrier>(`${this.endpoint}${id}/`);
    }

    createCalendrier(data: CalendrierCreate): Observable<Calendrier> {
        return this.api.post<Calendrier>(this.endpoint, data);
    }

    updateCalendrier(id: string, data: CalendrierUpdate): Observable<Calendrier> {
        return this.api.put<Calendrier>(`${this.endpoint}${id}/`, data);
    }

    deleteCalendrier(id: string): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}${id}/`);
    }
}
