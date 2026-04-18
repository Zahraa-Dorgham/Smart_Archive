// core/services/direction.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Direction, DirectionCreate, DirectionUpdate } from '../models/direction.model';
import { PaginatedResponse } from '../models/base.model';

@Injectable({
    providedIn: 'root'
})
export class DirectionService {
    private endpoint = '/directions/';

    constructor(private api: ApiService) { }

    getDirections(params?: any): Observable<PaginatedResponse<Direction>> {
        return this.api.get<PaginatedResponse<Direction>>(this.endpoint, params);
    }

    getDirection(id: string): Observable<Direction> {
        return this.api.get<Direction>(`${this.endpoint}${id}/`);
    }

    createDirection(data: DirectionCreate): Observable<Direction> {
        return this.api.post<Direction>(this.endpoint, data);
    }

    updateDirection(id: string, data: DirectionUpdate): Observable<Direction> {
        return this.api.put<Direction>(`${this.endpoint}${id}/`, data);
    }

    deleteDirection(id: string): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}${id}/`);
    }
}
