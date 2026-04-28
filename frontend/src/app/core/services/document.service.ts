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
        // Générer une référence unique avec timestamp (optionnel)
        if (data.reference) {
            formData.append('reference', data.reference);
        } else {
            const uniqueReference = `${data.idDoc}-${Date.now()}`;
            formData.append('reference', uniqueReference);
        }
        formData.append('titre', data.titre);
        formData.append('dossier', String(data.dossier));
        // phase_archive et type_document sont maintenant optionnels
        if (data.phase_archive) formData.append('phase_archive', data.phase_archive);
        
        // Gérer la date - peut être Date object, string, ou vide
        if (data.date_creation) {
            let dateStr: string;
            if (data.date_creation instanceof Date) {
                dateStr = data.date_creation.toISOString().split('T')[0];
            } else {
                dateStr = String(data.date_creation);
            }
            formData.append('date_creation', dateStr); // format YYYY-MM-DD
        }
        // Si date_creation est vide/null, le backend utilisera la valeur par défaut
        
        formData.append('niv_confidentialite', data.niv_confidentialite);
        if (data.type_document) formData.append('type_document', data.type_document);
        if (data.calendrier) formData.append('calendrier', data.calendrier);
        if (data.auteur) formData.append('auteur', data.auteur);
        if (data.description) formData.append('description', data.description);
        if (data.conservation_active_period !== undefined && data.conservation_active_period !== null) {
            formData.append('conservation_active_period', String(data.conservation_active_period));
        }
        if (data.conservation_semi_active_period !== undefined && data.conservation_semi_active_period !== null) {
            formData.append('conservation_semi_active_period', String(data.conservation_semi_active_period));
        }
        if (data.sort_final_type) formData.append('sort_final_type', data.sort_final_type);
        if (data.sort_final_comment) formData.append('sort_final_comment', data.sort_final_comment);
        if (data.sort_final_security_years !== undefined && data.sort_final_security_years !== null) {
            formData.append('sort_final_security_years', String(data.sort_final_security_years));
        }
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
