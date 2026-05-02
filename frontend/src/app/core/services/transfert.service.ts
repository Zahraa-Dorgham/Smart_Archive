import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PaginatedResponse } from '../models/base.model';
import { Transfert, TransfertCreate, TransfertUpdate } from '../models/transfert.model';

@Injectable({
    providedIn: 'root'
})
export class TransfertService {
    private endpoint = '/transferts/';

    constructor(private api: ApiService) { }

    getTransferts(params?: any): Observable<PaginatedResponse<Transfert>> {
        return this.api.get<PaginatedResponse<Transfert>>(this.endpoint, params);
    }

    getAvailableBoitiers(typeTransfer: string, transfertId?: string): Observable<any[]> {
        const params: Record<string, string> = {
            type_transfer: typeTransfer
        };
        if (transfertId) {
            params['transfert_id'] = transfertId;
        }
        return this.api.get<any[]>(`${this.endpoint}available_boitiers/`, params);
    }

    getTransfert(id: string): Observable<Transfert> {
        return this.api.get<Transfert>(`${this.endpoint}${id}/`);
    }

    createTransfert(data: TransfertCreate): Observable<Transfert> {
        return this.api.post<Transfert>(this.endpoint, this.serializePayload(data));
    }

    updateTransfert(id: string, data: TransfertUpdate): Observable<Transfert> {
        return this.api.put<Transfert>(`${this.endpoint}${id}/`, this.serializePayload(data));
    }

    deleteTransfert(id: string): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}${id}/`);
    }

    validateTransfert(id: string): Observable<{ status: string }> {
        return this.api.post<{ status: string }>(`${this.endpoint}${id}/valider/`, {});
    }

    private serializePayload(data: TransfertCreate | TransfertUpdate): Record<string, unknown> {
        const payload: Record<string, unknown> = {};

        Object.entries(data).forEach(([key, value]) => {
            if (key === 'id' || value === undefined) {
                return;
            }

            if (value instanceof Date) {
                payload[key] = value.toISOString();
                return;
            }

            if (value === '' || value === null) {
                payload[key] = key === 'boitier_ids' ? [] : null;
                return;
            }

            payload[key] = value;
        });

        return payload;
    }
}
