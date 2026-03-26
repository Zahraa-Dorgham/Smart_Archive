// core/services/document.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Document, DocumentCreate, DocumentUpdate } from '../models/document.model';
import { PaginatedResponse } from '../models/base.model';

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private endpoint = '/documents/';

    constructor(private api: ApiService) { }

    getDocuments(params?: any): Observable<PaginatedResponse<Document>> {
        return this.api.get<PaginatedResponse<Document>>(this.endpoint, params);
    }

    getDocument(id: string): Observable<Document> {
        return this.api.get<Document>(`${this.endpoint}${id}/`);
    }

    createDocument(data: DocumentCreate, fichier?: File): Observable<Document> {
        const formData = new FormData();
        // Ajouter tous les champs simples
        formData.append('idDoc', data.idDoc);
        formData.append('reference', data.reference);
        formData.append('titre', data.titre);
        formData.append('dossier', data.dossier);
        formData.append('phase_archive', data.phase_archive);
        formData.append('date_creation', data.date_creation.toISOString().split('T')[0]); // format YYYY-MM-DD
        formData.append('niv_confidentialite', data.niv_confidentialite);
        formData.append('type_document', data.type_document);
        if (data.auteur) formData.append('auteur', data.auteur);
        if (data.description) formData.append('description', data.description);
        if (fichier) formData.append('fichier', fichier);

        return this.api.post<Document>(this.endpoint, formData);
    }

    updateDocument(id: string, data: DocumentUpdate, fichier?: File): Observable<Document> {
        const formData = new FormData();
        // N'ajouter que les champs modifiés
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null && key !== 'id') {
                if (key === 'date_creation' && value instanceof Date) {
                    formData.append(key, value.toISOString().split('T')[0]);
                } else if (key === 'fichier' && fichier) {
                    // géré à part
                } else {
                    formData.append(key, String(value));
                }
            }
        });
        if (fichier) formData.append('fichier', fichier);

        return this.api.put<Document>(`${this.endpoint}${id}/`, formData);
    }

    deleteDocument(id: string): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}${id}/`);
    }
}