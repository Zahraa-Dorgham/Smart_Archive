import { Dossier } from './dossier.model';
import { PhaseArchive } from './phase-archive.model';
import { BaseModel } from './base.model';

export interface Document extends BaseModel {
    idDoc: string;
    reference: string;
    titre: string;
    dossier: Dossier | string;
    phase_archive: PhaseArchive | string;
    date_creation: Date;
    niv_confidentialite: string;
    version: number;
    type_document: string;
    auteur?: string;
    description?: string;
    fichier?: string;
    taille_fichier?: number;
    hash_fichier?: string;
    date_entree?: Date;
    date_modification?: Date;
}

export interface DocumentCreate {
    idDoc: string;
    reference: string;
    titre: string;
    dossier: string;
    phase_archive: string;
    date_creation: Date;
    niv_confidentialite: string;
    type_document: string;
    auteur?: string;
    description?: string;
}

export interface DocumentUpdate extends Partial<DocumentCreate> {
    id: string;
}