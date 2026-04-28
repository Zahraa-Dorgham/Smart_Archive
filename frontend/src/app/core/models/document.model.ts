import { Dossier } from './dossier.model';
import { PhaseArchive } from './phase-archive.model';
import { BaseModel } from './base.model';

export interface Document extends BaseModel {
    idDoc: string;
    // reference: string;
    titre: string;
    dossier: Dossier | number | string;
    calendrier?: string | null;
    calendrier_title?: string | null;
    // phase_archive: PhaseArchive | string;
    date_creation?: Date | null;
    niv_confidentialite: string;
    version: number;
    // type_document: string;
    auteur?: string;
    description?: string;
    conservation_active_period?: number | null;
    conservation_semi_active_period?: number | null;
    sort_final_type?: string | null;
    sort_final_comment?: string | null;
    sort_final_security_years?: number | null;
    fichier?: string;
    taille_fichier?: number;
    hash_fichier?: string;
    date_entree?: Date;
    date_modification?: Date;
}

export interface DocumentCreate {
    idDoc: string;
    reference?: string;
    titre: string;
    dossier: string | number;
    calendrier?: string | null;
    phase_archive?: string;
    date_creation?: Date;
    niv_confidentialite: string;
    type_document?: string;
    auteur?: string;
    description?: string;
    conservation_active_period?: number | null;
    conservation_semi_active_period?: number | null;
    sort_final_type?: string | null;
    sort_final_comment?: string | null;
    sort_final_security_years?: number | null;
}

export interface DocumentUpdate extends Partial<DocumentCreate> {
    id: string;
}
