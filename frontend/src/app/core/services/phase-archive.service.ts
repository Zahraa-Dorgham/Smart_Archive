import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PhaseArchive, PhaseArchiveCreate, PhaseArchiveUpdate } from '../models/phase-archive.model';
import { PaginatedResponse } from '../models/base.model';

@Injectable({
    providedIn: 'root'
})
export class PhaseArchiveService {
    private endpoint = '/phases-archive/';

    constructor(private api: ApiService) { }

    getPhases(params?: any): Observable<PaginatedResponse<PhaseArchive>> {
        return this.api.get<PaginatedResponse<PhaseArchive>>(this.endpoint, params);
    }

    getPhase(id: string): Observable<PhaseArchive> {
        return this.api.get<PhaseArchive>(`${this.endpoint}${id}/`);
    }

    createPhase(data: PhaseArchiveCreate): Observable<PhaseArchive> {
        return this.api.post<PhaseArchive>(this.endpoint, data);
    }

    updatePhase(id: string, data: PhaseArchiveUpdate): Observable<PhaseArchive> {
        return this.api.put<PhaseArchive>(`${this.endpoint}${id}/`, data);
    }

    deletePhase(id: string): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}${id}/`);
    }
}