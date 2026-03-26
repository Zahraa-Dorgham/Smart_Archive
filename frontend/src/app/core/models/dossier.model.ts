import { BaseModel } from './base.model';

export interface Dossier extends BaseModel {
    idDossier: string;
    reference: string;
    titre: string;
    description?: string;
    boitier?: string;
    boitier_idboit?: string;
    phase_archive: string;
    phase_archive_nom?: string;
    date_creation: Date;
    date_cloture?: Date;
    statut: string;
    niveau_confidentialite: string;
    nombre_documents?: number;
}

export interface DossierCreate {
    idDossier: string;
    reference: string;
    titre: string;
    description?: string;
    boitier?: string;
    phase_archive: string;
    date_creation: Date;
    date_cloture?: Date;
    statut: string;
    niveau_confidentialite: string;
}

export interface DossierUpdate extends Partial<DossierCreate> {
    id: string;
}